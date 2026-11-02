// Local in-memory PostgREST fixture. Never connect this fixture to a deployment.
import { createServer } from 'node:http'
const adminOrg = '22222222-2222-4222-8222-222222222222'
const schoolOrg = '33333333-3333-4333-8333-333333333333'
const tables = {
  partner_organizations: [
    { id:adminOrg, name:'검증용 관리자', org_type:'admin', is_active:true, region:null },
    { id:schoolOrg, name:'검증용 기관', org_type:'school', is_active:true, region:null },
  ],
  access_codes: [
    { id:'11111111-1111-4111-8111-111111111111', code:'ADMIN-LOCAL-TEST', organization_id:adminOrg, is_active:true, expires_at:null, max_usage:null, usage_count:0, label:'로컬 검증용 관리자', created_at:'2026-11-02T00:00:00Z' },
    { id:'44444444-4444-4444-8444-444444444444', code:'LOCAL-SCHOOL-TEST', organization_id:schoolOrg, is_active:true, expires_at:null, max_usage:null, usage_count:0, label:'로컬 검증용 기관', created_at:'2026-11-02T00:00:00Z' },
  ],
  partnership_inquiries: [{ id:'55555555-5555-4555-8555-555555555555', org_name:'검증용 문의기관', contact_name:'테스트 담당자', contact_email:'test@example.invalid', purpose:'로컬 화면 검증 자료', status:'pending', created_at:'2026-11-02T00:00:00Z' }],
}
createServer(async (request,response) => {
  const url = new URL(request.url,'http://127.0.0.1:4100')
  const table = url.pathname.split('/').at(-1)
  if(!tables[table]) { response.writeHead(404); response.end(); return }
  let rows = tables[table].filter(row=>[...url.searchParams].every(([key,value])=> {
    if(['select','order','limit'].includes(key))return true
    if(value==='is.null')return row[key]===null
    if(value.startsWith('eq.'))return String(row[key])===value.slice(3)
    return false
  }))
  let body=''; for await(const chunk of request)body+=chunk
  if(request.method==='POST') {
    const input=JSON.parse(body)
    if(table==='access_codes' && tables[table].some(row=>row.code===input.code)) {
      response.writeHead(409,{'Content-Type':'application/json'}); response.end(JSON.stringify({code:'23505'}));return
    }
    const row={id:crypto.randomUUID(),expires_at:null,max_usage:null,usage_count:0,created_at:new Date().toISOString(),...input}
    tables[table].push(row);rows=[row]
  } else if(request.method==='PATCH') {const patch=JSON.parse(body);rows.forEach(row=>Object.assign(row,patch))}
  else if(request.method==='DELETE') {tables[table]=tables[table].filter(row=>!rows.includes(row))}
  const count=rows.length
  if(table==='access_codes') rows=rows.map(row=>({...row,partner_organizations:tables.partner_organizations.find(org=>org.id===row.organization_id)??null}))
  response.writeHead(200,{'Content-Type':'application/json','Content-Range':`0-${Math.max(0,count-1)}/${count}`})
  response.end(request.method==='HEAD'?'':JSON.stringify(rows))
}).listen(4100,'127.0.0.1',()=>console.log('In-memory admin DB fixture: http://127.0.0.1:4100'))
