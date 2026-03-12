import { supabase } from './subabase.js';
import { initAuthUI } from './auth.js';


document.addEventListener('DOMContentLoaded', () => {
    const propertyContainer = document.getElementById('property-container');
    const searchTerm = document.getElementById('search');
    let properties = [];




    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        const navContainer = nav.querySelector('div');

        if (window.scrollY > 50) {
            nav.classList.add('py-2');
            navContainer.classList.remove('rounded-2xl', 'max-w-7xl');
            navContainer.classList.add('rounded-none', 'max-w-full', 'border-transparent', 'bg-white/90');
        } else {
            nav.classList.remove('py-2');
            navContainer.classList.add('rounded-2xl', 'max-w-7xl');
            navContainer.classList.remove('rounded-none', 'max-w-full', 'border-transparent', 'bg-white/90');
        }
    });

    initAuthUI();


const rateLimiter = rateLimit(fetchProperties,2000)

     async function fetchProperties () {

        const { data, error } = await supabase.from('properties').select('*')
            .order('created_at', { ascending: false })

        if (error) throw error;
        if (!data || data.length === 0) {
            propertyContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-500">No properties found</p></div>';
            return;
        } else {
            properties = data;
            loadProperties(properties);
        }

    }
    rateLimiter()

    function loadProperties(filterProperties) {
        propertyContainer.innerHTML =
            filterProperties.map(property => {
                const price = `$${property.price.toLocaleString()}`;
                const address = property.street;
                const city = property.city;
                const state = property.state;
                const beds = property.bedrooms;
                const baths = property.bathrooms;
                const sqft = property.sqft.toLocaleString();
                let image = [];
                const status = property.offer_type || 'For Sale';
                const type = property.type;
                const id = property.id;
                const description = property.description;

                try{
                    image = typeof property.image_url === 'string' && property.image_url.startsWith('[')
                    ? JSON.parse(property.image_url)
                    :(Array.isArray(property.image_url) ? property.image_url : (property.image_url ? [property.image_url] : []))

                }catch{
                    console.error('found some error')
                }

                return `
            <div class="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 fade-in flex flex-col">
               <div id="slider-${id}" class="relative h-64 rounded-[1.5rem] overflow-hidden m-4 mb-2 bg-gray-100 group/slider">
                   <div id="track-${id}" class="flex h-full transition-transform duration-500 ease-out">
                      ${image.map(img => `
                         <div class="min-w-full h-full">
                            <img src="${img}" alt="${address}" class="w-full h-full object-cover transition-transform duration-700" onerror="this.src='https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800'">
                         </div>
                      `).join('')}
                   </div>
                   
                   ${image.length > 1 ? `
                      <button class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-white hover:text-brand-600 z-10 prev-btn" data-id="${id}">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 opacity-0 group-hover/slider:opacity-100 transition-all hover:bg-white hover:text-brand-600 z-10 next-btn" data-id="${id}">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                         ${image.map((_, i) => `<div class="slider-dot-${id} w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300 cursor-pointer ${i === 0 ? 'w-4 bg-white' : ''}" data-index="${i}" data-id="${id}"></div>`).join('')}
                      </div>
                   ` : ''}

                   <div class="absolute top-4 left-4 flex gap-2 z-20">
                      <span class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">${status}</span>
                      <span class="px-3 py-1 bg-gray-900/60 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider border border-white/20">${type ? type.replace('_', ' ') : 'ESTATE'}</span>
                   </div>
                   <button onclick="toggleFavorite('${id}')" class="absolute top-4 right-4 z-20 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all shadow-lg active:scale-90 cursor-pointer">
                        <svg id='icon-${id}' xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                   </button>
                </div>
                <div class="px-6 pb-6 flex-1 flex flex-col">
                    <div class="flex items-center gap-1 mb-2 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-sm text-gray-500 truncate">${address}</span>
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors italic truncate">${city}, ${state}</h4>
                    <p class="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">${description || ''}</p>
                    <div class="mt-auto">
                        <div class="flex items-center justify-between py-4 border-t border-gray-50 flex-wrap gap-4">
                            <div class="flex items-center gap-4 text-gray-500 text-sm">
                                <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${beds}</span> Beds</span>
                                <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${baths}</span> Baths</span>
                                <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${sqft}</span> sqft</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-2xl font-bold text-gray-900">${price}</span>
                            <a href="details.html?id=${id}" class="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white group-hover:bg-brand-600 transition-all shadow-md active:scale-95 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>`;
            }).join('');

        if (!filterProperties || filterProperties.length === 0) {
            propertyContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-500">No properties found</p></div>';
            return;
        }

        // Initialize sliders
        filterProperties.forEach(property => {
            let image = typeof property.image_url === 'string' && property.image_url.startsWith('[') ? JSON.parse(property.image_url) : (Array.isArray(property.image_url) ? property.image_url : (property.image_url ? [property.image_url] : []));
            if(image.length <= 1) return;
            
            const id = property.id;
            let currentIdx = 0;
            const track = document.getElementById(`track-${id}`);
            const dots = document.querySelectorAll(`.slider-dot-${id}`);
            const nextBtn = document.querySelector(`.next-btn[data-id="${id}"]`);
            const prevBtn = document.querySelector(`.prev-btn[data-id="${id}"]`);

            const updateSlider = (idx) => {
                currentIdx = idx;
                if (track) track.style.transform = `translateX(-${currentIdx * 100}%)`;
                dots.forEach((dot, i) => {
                    if (i === currentIdx) {
                        dot.classList.add('w-4', 'bg-white');
                        dot.classList.remove('w-1.5', 'bg-white/40');
                    } else {
                        dot.classList.remove('w-4', 'bg-white');
                        dot.classList.add('w-1.5', 'bg-white/40');
                    }
                });
            };

            if(nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); updateSlider((currentIdx + 1) % image.length); });
            if(prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); updateSlider((currentIdx - 1 + image.length) % image.length); });
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); updateSlider(parseInt(dot.dataset.index)); });
            });
        });
    }

    async function toggleFavorite(propertyId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert("Please login to save properties!");

        if (!propertyId) return;

        const icon = document.getElementById(`icon-${propertyId}`)
        if (!icon) return;

        const { data: dataExisting, error } = await supabase.from('favorites').select('*').eq('property_id', propertyId).eq('user_id', user.id)
        if (error) {
            console.error('Error toggling favorite:', error)
            return
        }
        if (dataExisting.length > 0) {
            await supabase.from('favorites').delete().eq('property_id', propertyId).eq('user_id', user.id)
            icon.classList.remove('text-red-500', 'fill-current')
        } else {
            await supabase.from('favorites').insert({ property_id: propertyId, user_id: user.id })
            icon.classList.add('text-red-500', 'fill-current')
        }
    }

    window.toggleFavorite = toggleFavorite;

    function rateLimit(fn, delay){
        let timer;

        return(...args) =>{
            clearTimeout(timer)
            timer = setTimeout(()=>{
                fn(...args)
            }, delay)
        }
    }

    searchTerm.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filterProperties = properties.filter(property => {
            const c = property.city || '';
            const st = property.state || '';
            const str = property.street || '';
            const loc = property.location || '';
            const t = property.type || '';
            const ot = property.offer_type || '';
            const desc = property.description || '';
            const pr = property.price || 0;
            
            return c.toLowerCase().includes(search) || 
                   st.toLowerCase().includes(search) || 
                   str.toLowerCase().includes(search) || 
                   loc.toLowerCase().includes(search) || 
                   t.toLowerCase().includes(search) || 
                   ot.toLowerCase().includes(search) || 
                   desc.toLowerCase().includes(search) || 
                   pr.toLocaleString().includes(search);
        });
        loadProperties(filterProperties);
    });

    initAuthUI();
});
