import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [daisyui],
	daisyui: {
		themes: [
			{
				farmtrack: {
					primary: '#2d6a4f',
					'primary-content': '#ffffff',
					secondary: '#95d5b2',
					'secondary-content': '#1b4332',
					accent: '#d4a373',
					'accent-content': '#1b1b1b',
					neutral: '#344e41',
					'neutral-content': '#d8f3dc',
					'base-100': '#ffffff',
					'base-200': '#f0f7f4',
					'base-300': '#d8f3dc',
					'base-content': '#1b4332',
					info: '#3abff8',
					success: '#36d399',
					warning: '#fbbd23',
					error: '#f87272'
				}
			}
		]
	}
};
