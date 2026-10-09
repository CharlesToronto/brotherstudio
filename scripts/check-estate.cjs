// Run with node scripts/check-estate.cjs. No database or credentials required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const modules = new Map();
function load(file) {
 file = path.resolve(__dirname, '../src/lib', file);
 if (modules.has(file)) return modules.get(file).exports;
 const module = {exports:{}}; modules.set(file,module);
 const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:id=>load(id+'.ts'),URL,Intl,Date},{filename:file});
 return module.exports;
}
const {validateEstate,localizeEstate,safeEstateUrl}=load('estate.ts');
const {buildValuationCsv}=load('valuationCsv.ts');
const content={title:'Villa',location:'Valais',status:'Disponible',price:'CHF 500000',rooms:'4',area:'100 m²',exterior:'Jardin',description:'Description'};
const property={id:'test-villa',category:'Maison & villa',published:true,featured:false,sort_order:0,image:'/villa.jpg',images:['/villa.jpg'],documents:[],content_fr:content,content_en:{...content,title:'House',description:'Description in English'},updated_at:'2026-10-09T00:00:00Z'};
assert.ok(validateEstate(property));
assert.equal(validateEstate({...property,content_en:{...content,title:''}}),null);
assert.equal(validateEstate({...property,id:'vendre'}),null);
for(const url of ['javascript:alert(1)','//evil.example/a','/\\evil.example/a','data:text/html,test'])assert.equal(safeEstateUrl(url),false);
assert.equal(validateEstate({...property,documents:[{title:'Doc',title_en:'Doc',type:'PDF',href:'javascript:alert(1)'}]}),null);
assert.equal(localizeEstate(property,'en').title,'House');
assert.equal(localizeEstate(property,'fr').title,'Villa');
const request={first_name:'=1+1',last_name:'Test',email:'test@example.invalid',phone:'+410000000',property_address:'Villa — Valais',property_slug:'test-villa',locale:'en',created_at:'2026-10-09T12:00:00Z',status:'valuation',notes:'Call; tomorrow',next_follow_up:'2026-10-12'};
const csv=buildValuationCsv([request],true);
assert.ok(csv.includes("'=1+1"));assert.ok(csv.includes('Visite planifiée'));assert.ok(csv.includes('test-villa'));assert.ok(!csv.includes('Prix souhaité'));
console.log('Estate checks passed: validation, bilingual publishing, URL safety, localization, visit CSV and formula escaping.');
