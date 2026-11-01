// Dynamic SEO product detail page for Nur Fashion House
const SUPABASE_URL="https://icpklfqzrfceaazhashh.supabase.co";
const SUPABASE_KEY="sb_publishable_u_zCC7ueb8VGJYr9KzXZbg_gPHxRK1O";
const STORE_WHATSAPP="8801722574666";
const root=document.getElementById("productDetail");
const money=v=>"৳"+Number(v||0).toLocaleString("en-BD");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function images(p){let a=p.image_urls;if(typeof a==="string"){try{a=JSON.parse(a)}catch{a=[a]}}a=Array.isArray(a)?a.filter(x=>typeof x==="string"&&x.trim()):[];if(p.image_url&&!a.includes(p.image_url))a.unshift(p.image_url);return [...new Set(a)]}
function setMeta(name,content,property=false){let selector=property?'meta[property="'+name+'"]':'meta[name="'+name+'"]';let el=document.querySelector(selector);if(!el){el=document.createElement("meta");el.setAttribute(property?"property":"name",name);document.head.appendChild(el)}el.content=content}
function setProductSEO(p,imgs){
 const title=(p.name||"Fashion Product")+" | Nur Fashion House";
 const desc=String(p.description||("Shop "+(p.name||"this product")+" at Nur Fashion House in Bangladesh.")).replace(/\s+/g," ").slice(0,300);
 const canonical=location.origin+location.pathname+location.search;
 document.title=title;
 setMeta("description",desc);
 let link=document.querySelector('link[rel="canonical"]');if(link)link.href=canonical;
 setMeta("og:title",title,true);setMeta("og:description",desc,true);setMeta("og:url",canonical,true);if(imgs[0])setMeta("og:image",imgs[0],true);
 const schema={"@context":"https://schema.org","@type":"Product","name":p.name||"Nur Fashion House Product","description":desc,"image":imgs,"sku":String(p.id),"brand":{"@type":"Brand","name":"Nur Fashion House"},"category":p.category||"Fashion","offers":{"@type":"Offer","url":canonical,"priceCurrency":"BDT","price":String(Number(p.price||0)),"itemCondition":"https://schema.org/NewCondition"}};
 if(p.name_bn)schema.alternateName=p.name_bn;
 let ld=document.getElementById("product-jsonld");if(!ld){ld=document.createElement("script");ld.type="application/ld+json";ld.id="product-jsonld";document.head.appendChild(ld)}ld.textContent=JSON.stringify(schema);
}
function render(p){
 const imgs=images(p),sizes=Array.isArray(p.sizes)&&p.sizes.length?p.sizes:["Free"];
 setProductSEO(p,imgs);document.getElementById("crumbName").textContent=p.name||"Product";
 const msg=()=>{const size=document.getElementById("detailSize").value;const text="Hello Nur Fashion House! I want to order: "+p.name+" | Size: "+size+" | Price: "+money(p.price)+". Please confirm availability and delivery charge.";window.open("https://wa.me/"+STORE_WHATSAPP+"?text="+encodeURIComponent(text),"_blank","noopener,noreferrer")};
 root.innerHTML='<div class="detail-layout"><div class="detail-gallery">'+(imgs[0]?'<img class="detail-main-image" id="detailMainImage" src="'+esc(imgs[0])+'" alt="'+esc(p.name)+'" fetchpriority="high">':'<div class="detail-main-image" style="display:grid;place-items:center">NUR</div>')+'<div class="detail-thumbs">'+imgs.map((u,i)=>'<button type="button" data-photo="'+i+'" aria-label="View product photo '+(i+1)+'"><img src="'+esc(u)+'" alt="'+esc(p.name)+' photo '+(i+1)+'" loading="lazy"></button>').join("")+'</div></div><section class="detail-copy"><p class="kicker">'+esc(p.category||"NUR COLLECTION")+'</p><h1>'+esc(p.name)+'</h1><div class="detail-price">'+money(p.price)+'</div><p class="detail-description">'+esc(p.description||"A considered piece from the Nur Fashion House collection.")+'</p><label class="detail-size-label">SELECT SIZE<select id="detailSize">'+sizes.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join("")+'</select></label><button class="dark-button detail-order" id="detailOrder">ORDER VIA WHATSAPP ↗</button><p class="modal-note">We'll confirm product availability and delivery charge with you.</p></section></div>';
 document.getElementById("detailOrder").addEventListener("click",msg);
 root.querySelector(".detail-thumbs").addEventListener("click",e=>{const b=e.target.closest("[data-photo]");if(!b)return;const url=imgs[Number(b.dataset.photo)];const main=document.getElementById("detailMainImage");if(main&&url)main.src=url});
}
async function init(){
 document.getElementById("year").textContent=new Date().getFullYear();
 const id=new URLSearchParams(location.search).get("id");
 if(!id){root.innerHTML='<div class="detail-error">Product link is missing an ID. <a href="index.html#shop">Return to shop</a>.</div>';return}
 try{
  const url=SUPABASE_URL+"/rest/v1/products?id=eq."+encodeURIComponent(id)+"&active=eq.true&select=*";
  const response=await fetch(url,{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Accept":"application/json"},cache:"no-store"});
  const body=await response.text();
  if(!response.ok)throw new Error("Database error "+response.status+": "+body.slice(0,250));
  const rows=JSON.parse(body);
  if(!Array.isArray(rows)||!rows.length)throw new Error("Product not found or inactive.");
  render(rows[0]);
 }catch(e){
  console.error("Nur Fashion House product details:",e);
  root.innerHTML='<div class="detail-error"><strong>Product details could not load</strong><p>'+esc(e.message||"Unknown error")+'</p><p><a href="index.html#shop">Return to shop</a></p></div>';
 }
}
window.setTimeout(()=>{if(root&&root.textContent.includes("Loading product details"))root.innerHTML='<div class="detail-error">Product script did not start. Please press Ctrl+Shift+R.</div>'},12000);
init();