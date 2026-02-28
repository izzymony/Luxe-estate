import { supabase } from './subabase.js';


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('form')



    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault()

            const emailValue = document.getElementById('email').value
            const passwordValue = document.getElementById('password').value

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: emailValue,
                    password: passwordValue,
                })

                if (error) throw error

                const { data: profile } = await supabase.from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

                if (!profile) throw new Error("Profile not found")

                if (profile && profile.role === 'agent') {
                    window.location.href = 'agent.html'
                } else {
                    window.location.href = 'index.html'
                }


                alert("Login successful!")
            } catch (error) {
                console.error('Error during login:', error.message)
                alert("Error: " + error.message)
            }


        })
    }





})