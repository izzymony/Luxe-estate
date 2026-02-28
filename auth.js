import { supabase } from './subabase.js';

/**
 * Shared function to initialize Navbar and Profile UI.
 * This handles Sign In/Sign Out toggling, initials, and dropdowns.
 */
export async function initAuthUI() {
    const profileBtn = document.getElementById('profile');
    const profileContent = document.getElementById('profile-content');
    const profileInfo = document.getElementById('profile-info');
    const loginBtn = document.getElementById('login');
    const signupBtn = document.getElementById('signup');


    // Update UI based on user state
    async function updateNavbarUI(user) {
        if (user) {
            // Logged In: Show Profile, Hide Login/Signup
            loginBtn?.classList.add('hidden');
            signupBtn?.classList.add('hidden');
            profileBtn?.classList.remove('hidden');

            // Fetch profile data for initials and details
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Set initials
                const initials = `${profile.first_name[0]}${profile.last_name[0] || ''}`.toUpperCase();
                if (profileContent) {
                    profileContent.innerHTML = `<span class="text-sm font-bold">${initials}</span>`;
                }

                // Update Profile Dropdown Content
                if (profileInfo) {
                    profileInfo.innerHTML = `
                        <div class="space-y-2">
                            <p class="text-sm text-gray-500 font-medium">${profile.email}</p>
                            <div class="border-t pt-2">
                                <p class="font-bold text-gray-900">${profile.first_name} ${profile.last_name}</p>
                                <p class="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-2">${profile.role}</p>
                                       <div class="border-t pt-2">
                                       <a href="profile.html" class="text-black font-bold text-gray-900">profile</a>
                                       </div>
                                <div class="border-t pt-2 mt-1 space-y-1">
                                    <button id="logout-btn-global" class="w-full bg-brand-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-700 transition-all text-sm">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                    // Attach logout event
                    document.getElementById('logout-btn-global')?.addEventListener('click', async () => {
                        await supabase.auth.signOut();
                        window.location.href = 'index.html';
                    });
                }
            }
        } else {
            // Logged Out: Show Login/Signup, Hide Profile
            loginBtn?.classList.remove('hidden');
            signupBtn?.classList.remove('hidden');
            profileBtn?.classList.add('hidden');
            profileInfo?.classList.add('hidden');
        }
    }

    // Profile Dropdown Toggle
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileInfo?.classList.toggle('hidden');
    });

    // Close dropdown on click outside
    document.addEventListener('click', () => {
        profileInfo?.classList.add('hidden');
    });

   

    // Listen for Auth Changes
    supabase.auth.onAuthStateChange((event, session) => {
        updateNavbarUI(session?.user);
    });




    // Initial load check
    const { data: { user } } = await supabase.auth.getUser();
    updateNavbarUI(user);
}
