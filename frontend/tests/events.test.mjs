import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(new URL("../src/events.ts",import.meta.url),"utf8");
const compiled = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
const { eventItem,ticketToken } = await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
test("server IDs, ownership, registrations and audience tags map without prototype defaults",()=>{
 const e = eventItem({id:42,host_id:7,title:"Actual event",category:"Music",starts_at:"2099-12-30T10:00:00Z",ends_at:"2099-12-30T14:00:00Z",location:"Actual venue",description:"Actual description",going:0,registered:false,staff_count:2,host_name:"Actual host",liked:true,audiences:["student"]},7);
 assert.equal(e.id,"42"); assert.equal(e.hosting,true); assert.equal(e.attending,false); assert.equal(e.going,0); assert.equal(e.liked,true); assert.deepEqual(e.audiences,["student"]); assert.equal(e.ended,false);
 assert.equal(eventItem({...{id:42,host_id:7,starts_at:"2000-01-01T10:00:00Z",ends_at:"2000-01-01T12:00:00Z"}},8).hosting,false);
});
test("QR payload validates its event and token before submitting a check-in",()=>{
 const token="a_valid_ticket_token_123456789";
 assert.equal(ticketToken("BITBIT:TICKET:42:"+token,"42"),token);
 assert.throws(()=>ticketToken("BITBIT:TICKET:43:"+token,"42"),/different event/);
 for (const bad of ["anything","BITBIT:TICKET:42:short","https://example.com/","BITBIT:TICKET:42:<script>"]) assert.throws(()=>ticketToken(bad,"42"),/not a valid/);
});
