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




    async function fetchProperties() {

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




    fetchProperties();

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
                const image = property.image_url;
                const status = property.offer_type || 'For Sale';
                const type = property.type;
                const id = property.id;
                const description = property.description;

                return `
            <div class="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-brand-100/50 transition-all duration-500 fade-in">
                <div class="relative h-64 rounded-[1.5rem] overflow-hidden mb-6 bg-gray-100 m-4">
                    <img src="${image}" alt="${address}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                         style="image-rendering: -webkit-optimize-contrast;"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1512918766674-ed62b9aed97a?q=80&w=1200&auto=format&fit=crop';">
                    <div class="absolute top-4 left-4 flex gap-2">
                        <span class="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-full shadow-lg">${status}</span>
                        <span class="px-4 py-1.5 bg-gray-900/40 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">${type}</span>
                    </div>
                    <div class="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all shadow-lg active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                </div>
                <div class="px-6 pb-6">
                    <div class="flex items-center gap-1 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-sm text-gray-500">${address}</span>
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-4 group-hover:text-brand-600 transition-colors italic">${city}, ${state}</h4>
                    <p class="text-sm text-gray-400 mb-4 line-clamp-2">${description}</p>
                    <div class="flex items-center justify-between py-4 border-t border-gray-50 flex-wrap gap-4">
                        <div class="flex items-center gap-4 text-gray-500 text-sm">
                            <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${beds}</span> Beds</span>
                            <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${baths}</span> Baths</span>
                            <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${sqft}</span> sqft</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-2xl font-bold text-gray-900">${price}</span>
                        <a href="details.html?id=${id}" class="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white group-hover:bg-brand-600 transition-all shadow-md active:scale-95 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>`;
            }).join('');

        if (!filterProperties || filterProperties.length === 0) {
            propertyContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-500">No properties found</p></div>';
        }
    }


    searchTerm.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filterProperties = properties.filter(property => {
            return property.city.toLowerCase().includes(search) || property.state.toLowerCase().includes(search) || property.street.toLowerCase().includes(search);
        });
        loadProperties(filterProperties);
    });

    initAuthUI();
});
