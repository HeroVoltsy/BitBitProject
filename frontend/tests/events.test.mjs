import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/events.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText.replace(/^import .*from "\.\/api";$/m,'const {api,ApiError}=globalThis.__eventTest;');
class ApiError extends Error{constructor(status){super('request failed');this.status=status;}}
let handler=()=>{};globalThis.__eventTest={api:(...args)=>handler(...args),ApiError};
const {eventItem,ticketToken,myRegistration,attendanceSummary}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('existing event response maps without inventing server fields or end times',()=>{
 const event=eventItem({id:9,host_id:3,title:'Actual event',category:'Music',starts_at:'2099-12-30T10:00:00Z',location:'Actual venue',description:'Actual details',promoted:false,latitude:null,longitude:null,cover_image_url:null,status:'published',created_at:'2026-01-01T00:00:00Z'},3);
 assert.equal(event.id,'9');assert.equal(event.hosting,true);assert.equal(event.hostName,'Organizer #3');assert.equal(event.countsAvailable,false);assert.equal(event.started,false);assert.equal(event.ended,false);assert.ok(event.dateLine.includes(String.fromCharCode(183)));assert.equal(event.endsAt,undefined);
});
test('registration absence is normal, while authorization/server errors remain errors',async()=>{
 handler=async path=>{assert.equal(path,'/api/v1/events/9/registrations/me');throw new ApiError(404);};assert.equal(await myRegistration('9'),null);
 for(const status of [401,403,500]){handler=async()=>{throw new ApiError(status);};await assert.rejects(myRegistration('9'),e=>e.status===status);}
});
test('attendance counts come from the existing attendee endpoint',async()=>{
 handler=async path=>{assert.equal(path,'/api/v1/events/9/attendees');return [{checked_in_at:null},{checked_in_at:'2026-11-27T10:00:00Z'}];};assert.deepEqual(await attendanceSummary('9'),{registered:2,checked_in:1});
});
test('scans validate event-specific QR payloads',()=>{
 const token='test_token_with_more_than_20_chars';assert.equal(ticketToken('BITBIT:TICKET:9:'+token,'9'),token);assert.throws(()=>ticketToken('BITBIT:TICKET:8:'+token,'9'),/different event/);assert.throws(()=>ticketToken('not a ticket','9'),/not a valid/);
});
