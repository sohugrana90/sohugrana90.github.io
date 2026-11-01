const $=id=>document.getElementById(id);
let sb=null,productsCache=[],ordersCache=[];
const money=v=>"৳"+Number(v||0).toLocaleString("en-BD");
const config=()=>({url:localStorage.getItem("nfh_supabase_url"),key:localStorage.getItem("nfh_supabase_key")});
function connect(){
 const c=config();
 if(!c.url||!c.key){$("setup").classList.remove("hidden");$("login").classList.add("hidden");return}
 sb=window.supabase.createClient(c.url,c.key);
 $("setup").classList.add("hidden");$("login").classList.remove("hidden");
 sb.auth.getSession().then(({data,error})=>{if(error){$("loginMsg").textContent=error.message;return}if(data.session)showDashboard()});
}
const saved=config();if(saved.url)$("projectUrl").value=saved.url;if(saved.key)$("anonKey").value=saved.key;connect();
$("saveConfig").onclick=()=>{const url=$("projectUrl").value.trim(),key=$("anonKey").value.trim();if(!url.startsWith("https://")||!key){alert("Enter a valid Supabase URL and anon/public key.");return}localStorage.setItem("nfh_supabase_url",url);localStorage.setItem("nfh_supabase_key",key);connect()};
$("signIn").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});$("loginMsg").textContent=error?error.message:"Signed in.";if(!error)showDashboard()};
$("signOut").onclick=async()=>{await sb.auth.signOut();$("dashboard").classList.add("hidden");$("login").classList.remove("hidden")};
function showDashboard(){
 $("login").classList.add("hidden");$("dashboard").classList.remove("hidden");
 $("todayLabel").textContent=new Date().toLocaleDateString("en-BD",{day:"numeric",month:"short",year:"numeric"});
 loadDashboardData();
}
async function loadDashboardData(){await Promise.all([loadProducts(),loadOrders()]);renderMetrics()}
function showSection(name){
 ["overview","products","orders"].forEach(key=>$(key+"Section").classList.toggle("hidden",key!==name));
 document.querySelectorAll("[data-section]").forEach(b=>b.classList.toggle("active",b.dataset.section===name));
 $("pageTitle").textContent=name.charAt(0).toUpperCase()+name.slice(1);
}
document.querySelectorAll("[data-section]").forEach(b=>b.onclick=()=>showSection(b.dataset.section));
document.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>showSection(b.dataset.goto));
function renderMetrics(){
 const active=productsCache.filter(p=>p.active===true).length;
 const revenue=ordersCache.reduce((sum,o)=>sum+Number(o.total||0),0);
 $("metricProducts").textContent=productsCache.length.toLocaleString("en-BD");
 $("metricActive").textContent=active.toLocaleString("en-BD");
 $("metricOrders").textContent=ordersCache.length.toLocaleString("en-BD");
 $("metricRevenue").textContent=money(revenue);
 $("sideProductCount").textContent=productsCache.length;
 $("sideOrderCount").textContent=ordersCache.length;
 renderRecentProducts();
}
function productPhotos(p){
 let raw=p.image_urls;if(typeof raw==="string"){try{raw=JSON.parse(raw)}catch(_){raw=[raw]}}
 const arr=Array.isArray(raw)?raw.filter(Boolean):[];
 if(p.image_url&&!arr.includes(p.image_url))arr.unshift(p.image_url);
 return arr;
}
function renderRecentProducts(){
 const rows=productsCache.slice(0,5);
 $("recentProducts").innerHTML=rows.length?tableMarkup(rows,false):'<div class="empty-state">No products yet. Add your first product.</div>';
}
function tableMarkup(rows,actions=true){
 return '<table class="admin-table"><thead><tr><th>PRODUCT</th><th>STATUS</th><th>PRICE</th><th>STOCK</th><th>PHOTOS</th>'+(actions?'<th>ACTIONS</th>':'')+'</tr></thead><tbody>'+
 rows.map(p=>{const photos=productPhotos(p);return '<tr><td><div class="product-cell">'+(photos[0]?'<img src="'+esc(photos[0])+'" alt="">':'<span class="product-placeholder"></span>')+'<span><b>'+esc(p.name)+'</b><small>'+esc(p.category||"Uncategorised")+'</small></span></div></td><td><span class="status-pill '+(p.active?'active':'hidden-status')+'">'+(p.active?'Active':'Hidden')+'</span></td><td>'+money(p.price)+'</td><td>'+photos.length+' photo(s)</td>'+(actions?'<td><div class="row-actions"><button class="outline-btn" data-edit="'+esc(p.id)+'">Edit</button><button class="danger-btn" data-delete="'+esc(p.id)+'">Delete</button></div></td>':'')+'</tr>'}).join("")+'</tbody></table>';
}
async function loadProducts(){
 const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
 if(error){$("productTable").innerHTML='<div class="empty-state">'+esc(error.message)+'</div>';$("recentProducts").textContent=error.message;return}
 productsCache=data||[];renderProductTable();renderMetrics();
}
function renderProductTable(){
 const term=$("productSearchAdmin").value.trim().toLowerCase(),filter=$("productFilter").value;
 const rows=productsCache.filter(p=>{
  const matches=[p.name,p.name_bn,p.category,p.description].filter(Boolean).join(" ").toLowerCase().includes(term);
  const status=filter==="all"||(filter==="active"&&p.active)||(filter==="hidden"&&!p.active);
  return matches&&status;
 });
 $("productResultCount").textContent=rows.length+" products";
 $("productTable").innerHTML=rows.length?tableMarkup(rows,true):'<div class="empty-state">No matching products found.</div>';
}
$("productSearchAdmin").oninput=renderProductTable;$("productFilter").onchange=renderProductTable;
$("productTable").addEventListener("click",e=>{
 const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
 if(edit){const p=productsCache.find(x=>String(x.id)===edit.dataset.edit);if(p)editProduct(p)}
 if(del)deleteProduct(del.dataset.delete);
});
$("recentProducts").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]");if(edit){showSection("products");const p=productsCache.find(x=>String(x.id)===edit.dataset.edit);if(p)editProduct(p)}});
function openEditor(){
 $("productForm").reset();$("productId").value="";$("pActive").checked=true;$("pStock").value="0";
 window.currentProductImages=[];$("existingPhotoNote").textContent="";$("productMsg").textContent="";
 $("editorTitle").textContent="Add product";$("productEditor").classList.remove("hidden");
 $("productEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
$("addProductBtn").onclick=()=>{showSection("products");openEditor()};
$("tableAddProduct").onclick=openEditor;$("quickAdd").onclick=()=>{showSection("products");openEditor()};
$("closeEditor").onclick=()=>$("productEditor").classList.add("hidden");
$("clearForm").onclick=()=>{openEditor()};
function editProduct(p){
 window.currentProductImages=productPhotos(p);
 $("editorTitle").textContent="Edit product";
 $("existingPhotoNote").textContent=window.currentProductImages.length?"Current gallery: "+window.currentProductImages.length+" photo(s). New uploads will be added.":"No existing product photos.";
 $("productId").value=p.id;$("pName").value=p.name||"";$("pNameBn").value=p.name_bn||"";
 $("pCategory").value=p.category||"Women's Fashion";$("pPrice").value=p.price??"";$("pStock").value=p.stock_quantity??0;
 $("pSizes").value=Array.isArray(p.sizes)?p.sizes.join(","):"";
 $("pDescription").value=p.description||"";$("pActive").checked=!!p.active;
 $("pImage").value="";$("productMsg").textContent="";
 $("productEditor").classList.remove("hidden");$("productEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
$("productForm").onsubmit=async e=>{
 e.preventDefault();const id=$("productId").value;const save=$("saveProductBtn");
 save.disabled=true;save.textContent="Saving…";$("productMsg").textContent="Uploading photos and saving product…";
 try{
  const existing=window.currentProductImages||[],files=Array.from($("pImage").files||[]),uploaded=[];
  for(const file of files){
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
   const path=crypto.randomUUID()+"."+(ext||"jpg");
   const up=await sb.storage.from("product-images").upload(path,file,{upsert:true});
   if(up.error)throw up.error;
   uploaded.push(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl);
  }
  const image_urls=[...new Set([...existing,...uploaded])];
  const payload={name:$("pName").value.trim(),name_bn:$("pNameBn").value.trim(),category:$("pCategory").value.trim(),price:Number($("pPrice").value),stock_quantity:Number($("pStock").value),sizes:$("pSizes").value.split(",").map(x=>x.trim()).filter(Boolean),description:$("pDescription").value.trim(),active:$("pActive").checked};
  if(image_urls.length){payload.image_urls=image_urls;payload.image_url=image_urls[0]}
  const res=id?await sb.from("products").update(payload).eq("id",id):await sb.from("products").insert(payload);
  if(res.error)throw res.error;
  $("productMsg").textContent="Product saved successfully. "+uploaded.length+" new photo(s) uploaded.";
  $("productForm").reset();$("productId").value="";window.currentProductImages=[];$("existingPhotoNote").textContent="";
  await loadProducts();
 }catch(err){$("productMsg").textContent=err.message||"Could not save product."}
 finally{save.disabled=false;save.textContent="Save product"}
};
async function deleteProduct(id){
 const p=productsCache.find(x=>String(x.id)===String(id));
 if(!confirm('Delete "'+(p?.name||"this product")+'"? This cannot be undone.'))return;
 const {error}=await sb.from("products").delete().eq("id",id);
 if(error)alert(error.message);else await loadProducts();
}
async function loadOrders(){
 const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false});
 if(error){$("orderList").innerHTML='<div class="empty-state">'+esc(error.message)+'</div>';return}
 ordersCache=data||[];$("sideOrderCount").textContent=ordersCache.length;renderMetrics();
 $("orderList").innerHTML=ordersCache.length?ordersCache.map(o=>{
  const customer=o.customer_name||o.name||"Customer";
  return '<article class="order-card"><div><strong>'+esc(customer)+' · '+esc(o.phone||"No phone")+'</strong><p>'+esc(o.address||"No address")+'</p><p>'+esc(JSON.stringify(o.items||[]))+'</p><p>'+new Date(o.created_at).toLocaleString("en-BD")+'</p></div><div class="order-meta"><strong>'+money(o.total)+'</strong><select data-status="'+esc(o.id)+'">'+["new","confirmed","shipped","completed","cancelled"].map(s=>'<option value="'+s+'" '+(o.status===s?'selected':'')+'>'+s+'</option>').join("")+'</select></div></article>'
 }).join(""):'<div class="empty-state">No customer orders found yet.</div>';
}
$("orderList").addEventListener("change",async e=>{
 const sel=e.target.closest("[data-status]");if(!sel)return;
 const {error}=await sb.from("orders").update({status:sel.value}).eq("id",sel.dataset.status);
 if(error){alert(error.message);await loadOrders()}
});
$("refreshOrders").onclick=loadOrders;
$("exportBtn").onclick=()=>{
 const blob=new Blob([JSON.stringify(productsCache,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="nur-fashion-house-products.json";a.click();URL.revokeObjectURL(url);
};
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async()=>{
 const file=$("importFile").files[0];if(!file)return;
 try{
  const parsed=JSON.parse(await file.text());if(!Array.isArray(parsed))throw new Error("JSON file must contain an array of products.");
  const rows=parsed.map(p=>({name:String(p.name||"").trim(),name_bn:p.name_bn||"",category:p.category||"Women's Fashion",price:Number(p.price||0),sizes:Array.isArray(p.sizes)?p.sizes:[],description:p.description||"",active:p.active!==false,...(Array.isArray(p.image_urls)?{image_urls:p.image_urls}:{}),...(p.image_url?{image_url:p.image_url}:{})})).filter(p=>p.name);
  if(!rows.length)throw new Error("No valid product names found in the file.");
  const {error}=await sb.from("products").insert(rows);if(error)throw error;
  alert(rows.length+" products imported.");await loadProducts();
 }catch(err){alert("Import failed: "+(err.message||err))}finally{$("importFile").value=""}
};
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
window.currentProductImages=[];
