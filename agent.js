import { supabase } from './subabase.js';
import { initAuthUI } from './auth.js';


document.addEventListener('DOMContentLoaded', () => {

   const agentListings = document.getElementById('agent-listings');
   const uploadModal = document.getElementById('upload-modal');
   const openModalBtn = document.getElementById('open-upload-modal');
   const closeModalBtn = document.getElementById('close-upload-modal');
   const modalBackdrop = document.getElementById('upload-modal-backdrop');
   const uploadForm = document.getElementById('upload-form');
   const agentPortrait = document.getElementById('agent-portrait');
   let edittingPropertyId = null;
   let selectedFiles = []; // Array to store files for upload

   async function protectAgentPage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         window.location.href = 'login.html';
         return;
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!profile || profile.role !== 'agent') {
         window.location.href = 'index.html';
         return;
      }

      // Load agent's listings after protection check
      loadAgentListings(user.id);
   }

   // Modal Logic
   const toggleModal = (show) => {
      if (show) {
         uploadModal.classList.remove('hidden');
         uploadModal.classList.add('flex');
         document.body.style.overflow = 'hidden';
      } else {
         uploadModal.classList.add('hidden');
         uploadModal.classList.remove('flex');
         document.body.style.overflow = 'auto';
         uploadForm.reset();
         selectedFiles = [];
         const previewContainer = document.getElementById('selected-images-preview');
         if (previewContainer) previewContainer.innerHTML = '';
      }
   }
  
   const fileInput = document.getElementById('property-image');
   const previewContainer = document.getElementById('selected-images-preview');

   if (fileInput) {
      fileInput.addEventListener('change', (e) => {
         const files = Array.from(e.target.files);

         // Add new files to our global selectedFiles array
         files.forEach(file => {
            // Check if file is already added (optional)
            const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
               selectedFiles.push(file);
            }
         });

         renderSelectedPreviews();
         // Reset input so the same file can be picked again if removed
         fileInput.value = '';
      });
   }

   function renderSelectedPreviews() {
      if (!previewContainer) return;
      previewContainer.innerHTML = '';
      selectedFiles.forEach((file, index) => {
         const reader = new FileReader();
         const div = document.createElement('div');
         div.className = 'relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200';

         div.innerHTML = `
            <img class="w-full h-full object-cover" src="" alt="preview">
            <button type="button" class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" data-index="${index}">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         `;

         reader.onload = (e) => {
            div.querySelector('img').src = e.target.result;
         };
         reader.readAsDataURL(file);

         div.querySelector('button').onclick = (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            selectedFiles.splice(idx, 1);
            renderSelectedPreviews();
         };

         previewContainer.appendChild(div);
      });
   }

   if (openModalBtn) openModalBtn.onclick = () => toggleModal(true);
   if (closeModalBtn) closeModalBtn.onclick = () => toggleModal(false);
   if (modalBackdrop) modalBackdrop.onclick = () => toggleModal(false);

   if (uploadForm) {
      uploadForm.onsubmit = async (e) => {
         e.preventDefault();
         const submitBtn = document.getElementById('submit-listing-btn');
         const originalText = submitBtn.innerText;

         try {
            submitBtn.disabled = true;
            submitBtn.innerText = edittingPropertyId ? 'Saving Changes...' : 'Uploading...';

            const { data: { user } } = await supabase.auth.getUser();
            let uploadedImageUrl = [];

            if (selectedFiles.length > 0) {
               const uploadPromises = selectedFiles.map(async (file) => {
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Math.random()}.${fileExt}`;
                  const filePath = `${user.id}/${fileName}`;

                  const { error: uploadError } = await supabase.storage
                     .from('property-images')
                     .upload(filePath, file);

                  if (uploadError) throw uploadError;

                  const { data: { publicUrl } } = supabase.storage
                     .from('property-images')
                     .getPublicUrl(filePath);

                  uploadedImageUrl.push(publicUrl);
               });

               await Promise.all(uploadPromises);
            } else if (!edittingPropertyId) {
               alert('Please select an image file for your new listing.');
               submitBtn.disabled = false;
               submitBtn.innerText = originalText;
               return;
            }

            // 2. Prepare Data
            const propertyData = {
               street: document.getElementById('property-street').value,
               city: document.getElementById('property-city').value,
               state: document.getElementById('property-state').value,
               price: parseFloat(document.getElementById('property-price').value),
               bedrooms: parseInt(document.getElementById('property-beds').value),
               bathrooms: parseFloat(document.getElementById('property-baths').value),
               sqft: parseInt(document.getElementById('property-sqft').value),
               offer_type: document.getElementById('property-offer-type').value,
               type: document.getElementById('property-type').value,
               description: document.getElementById('property-description').value,
            };

            if (uploadedImageUrl.length > 0) {
               propertyData.image_url = uploadedImageUrl;
            }

            // 3. Save (Update or Insert)
            if (edittingPropertyId) {
               const { error: updateError } = await supabase
                  .from('properties')
                  .update(propertyData)
                  .eq('id', edittingPropertyId);

               if (updateError) throw updateError;
               alert('Listing updated successfully!');
            } else {
               propertyData.agent_id = user.id;
               propertyData.created_at = new Date().toISOString();
               const { error: insertError } = await supabase.from('properties').insert([propertyData]);
               if (insertError) throw insertError;
               alert('Listing published successfully!');
            }

            toggleModal(false);
            loadAgentListings(user.id);
            edittingPropertyId = null; // Important: Clear edit state
         } catch (error) {
            console.error('Error saving property:', error);
            alert('Failed to save listing: ' + error.message);
         } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
         }
      };
   }

   async function loadAgentListings(userId) {



      try {
         agentListings.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-500">Loading your listings...</p></div>';

         const { data: properties, error } = await supabase
            .from('properties')
            .select('*')
            .eq('agent_id', userId)
            .order('created_at', { ascending: false });

         if (error) throw error;

         if (!properties || properties.length === 0) {
            agentListings.innerHTML = `
               <div class="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <div class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-400">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">No active listings yet</h3>
                  <p class="text-gray-500 mb-8">Start growing your portfolio by uploading your first property.</p>
                  <button onclick="document.getElementById('open-upload-modal').click()" class="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all">Create First Listing</button>
               </div>
            `;
            return;
         }

         agentListings.innerHTML = '';
         properties.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden';
            let images = [];
            try {
               images = typeof prop.image_url === 'string' && prop.image_url.startsWith('[')
                  ? JSON.parse(prop.image_url)
                  : (Array.isArray(prop.image_url) ? prop.image_url : [prop.image_url]);

               // Filter out nulls
               images = images.filter(img => img);
            } catch (e) {
               console.error("Error parsing image URL:", e);
               images = Array.isArray(prop.image_url) ? prop.image_url : [prop.image_url];
            }

            const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(prop.price);

            card.innerHTML = `
                <div class="card-slider-container group/slider mb-6" data-current="0" data-total="${images.length}">
                   <div class="card-slider-track">
                      ${images.map(img => `
                         <div class="card-slide">
                            <img src="${img}" alt="${prop.street}" onerror="this.src='https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800'">
                         </div>
                      `).join('')}
                   </div>
                   
                   ${images.length > 1 ? `
                      <button class="card-slider-btn left-2 card-prev-btn">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button class="card-slider-btn right-2 card-next-btn">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <div class="card-slider-dots">
                         ${images.map((_, i) => `<div class="card-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
                      </div>
                   ` : ''}

                   <div class="absolute top-4 left-4 flex gap-2 z-20">
                      <span class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">${prop.offer_type}</span>
                      <span class="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">${prop.type}</span>
                   </div>
                </div>
               <div class="px-2 pb-2">
                  <h4 class="text-lg font-bold text-gray-900 mb-1 truncate">${prop.street}</h4>
                  <p class="text-sm text-gray-400 mb-4">${prop.city}, ${prop.state}</p>
                  <p class="text-sm text-gray-400 mb-4 line-clamp-2">${prop.description}</p>
                  <p class="text-sm text-gray-400 mb-4">${prop.bedrooms} Beds | ${prop.bathrooms} Baths | ${prop.sqft} sqft</p>
                  <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                     <span class="text-xl font-bold text-gray-900">${price}</span>
                 
                     <div class="flex gap-2">
                         <button data-id='${prop.id}'  id='edit-listing' class=" edit-listing-btn w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                             </svg>
                         </button>
                     </div>
                  </div>
               </div>
            `;

          
            

/* setTimeout(async ()=>{
   let lat = 51.505
   let lng = -0.09
   const fullAddress = `${prop.city},${prop.state}`

   try{
      if(fullAddress){
         const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
         const data = await response.json();
         if(data.length > 0){
            lat = data[0].lat;
            lng = data[0].lon;
         } else{
            console.warn(`could not find coordinates for ${fullAddress}`)
            const fallbackAddress = `${prop.city},${prop.state}`.replace(/^, /, '').trim();
            if(fallbackAddress){
               const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}`);
               const fallbackData = await fallbackResponse.json();
               if(fallbackData.length > 0){
                  lat = fallbackData[0].lat;
                  lng = fallbackData[0].lon;
               }
            }
            
         }
      }
   }catch(error){
      console.error('Error fetching coordinates:', error);
   }

   const map = L.map(`map`).setView([lat, lng], 15);

   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
       maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
   }).addTo(map)
     
   
   
   const marker = L.marker ([lat, lng]).addTo(map);
   marker.bindPopup(`<b>${prop.street}</b><br>${prop.city}, ${prop.state}`).openPopup();

   const circle = L.circle([lat, lng], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500
   }).addTo(map);
})
    */
            agentListings.appendChild(card);
         });
      } catch (error) {
         console.error('Error loading listings:', error);
         agentListings.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-500">Failed to load listings.</p></div>';
      }

 
   }

   async function editForm(id) {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: property, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();

      if (error || !property) {
         alert('Error fetching property details');
         return;
      }

      if (property.agent_id !== user.id) {
         alert('You are not authorized to edit this property');
         return;
      }

      // Set global edit ID
      edittingPropertyId = property.id;

      // Fill form fields
      document.getElementById('property-street').value = property.street || '';
      document.getElementById('property-city').value = property.city || '';
      document.getElementById('property-state').value = property.state || '';
      document.getElementById('property-price').value = property.price || '';
      document.getElementById('property-beds').value = property.bedrooms || '';
      document.getElementById('property-baths').value = property.bathrooms || '';
      document.getElementById('property-sqft').value = property.sqft || '';
      document.getElementById('property-offer-type').value = property.offer_type || '';
      document.getElementById('property-type').value = property.type || '';
      document.getElementById('property-description').value = property.description || '';

      // Update Modal UI
      const modalTitle = document.getElementById('modal-title');
      const submitBtn = document.getElementById('submit-listing-btn');
      if (modalTitle) modalTitle.innerText = 'Edit Property Listing';
      if (submitBtn) submitBtn.innerText = 'Save Changes';

      toggleModal(true);
   }

   agentListings.addEventListener('click', (e) => {
      // 1. Handle Card Slider Navigation
      const nextBtn = e.target.closest('.card-next-btn');
      const prevBtn = e.target.closest('.card-prev-btn');

      if (nextBtn || prevBtn) {
         const container = e.target.closest('.card-slider-container');
         const track = container.querySelector('.card-slider-track');
         const dots = container.querySelectorAll('.card-dot');
         let current = parseInt(container.dataset.current);
         const total = parseInt(container.dataset.total);

         if (nextBtn) {
            current = (current + 1) % total;
         } else {
            current = (current - 1 + total) % total;
         }

         container.dataset.current = current;
         track.style.transform = `translateX(-${current * 100}%)`;

         // Update dots
         dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === current);
         });
         return; // Stop here
      }

      // 2. Handle Edit Button
      const editBtn = e.target.closest('.edit-listing-btn');

      if (editBtn) {
         const id = editBtn.dataset.id;
         editForm(id);
      }
   });


   if (openModalBtn) openModalBtn.addEventListener('click', () => {
      edittingPropertyId = null;
      uploadForm.reset();
      const modalTitle = document.getElementById('modal-title');
      const submitBtn = document.getElementById('submit-listing-btn');
      if (modalTitle) modalTitle.innerText = 'Create Property Listing';
      if (submitBtn) submitBtn.innerText = 'Publish';
      toggleModal(true);
   });

   protectAgentPage();
   initAuthUI();
});
