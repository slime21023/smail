import { defaultTheme } from '@sveltepress/theme-default';
import { sveltepress } from '@sveltepress/vite';
import { defineConfig } from 'vite';

const repository = 'https://github.com/slime21023/smail';

export default defineConfig({
	plugins: [
		sveltepress({
			siteConfig: {
				title: 'smail',
				description: 'Embeddable email template editing for Svelte.'
			},
			theme: defaultTheme({
				github: repository,
				editLink: `${repository}/edit/main/docs/src/routes/:route`,
				navbar: [
					{ title: 'Guides', to: '/guides/getting-started/' },
					{ title: 'API reference', to: '/reference/api/' },
					{ title: 'GitHub', to: repository, external: true }
				],
				sidebar: {
					'/guides/': [
						{
							title: 'Developer guides',
							items: [
								{ title: 'Getting started', to: '/guides/getting-started/' },
								{ title: 'Editor controller', to: '/guides/editor-controller/' },
								{ title: 'Template files and export', to: '/guides/persistence-and-delivery/' },
								{ title: 'Customization', to: '/guides/customization/' }
							]
						}
					],
					'/reference/': [
						{
							title: 'Reference',
							items: [
								{ title: 'API reference', to: '/reference/api/' },
								{ title: 'Architecture', to: '/reference/architecture/' }
							]
						}
					],
					'/operations/': [
						{
							title: 'Operations',
							items: [
								{ title: 'Production readiness', to: '/operations/production-readiness/' },
								{ title: 'Email rendering matrix', to: '/operations/email-rendering-matrix/' },
								{ title: 'Publishing', to: '/operations/publishing/' }
							]
						}
					]
				},
				themeColor: {
					light: '#ffffff',
					dark: '#0f172a',
					primary: '#2563eb',
					hover: '#1d4ed8',
					gradient: { start: '#2563eb', end: '#7c3aed' }
				},
				highlighter: {
					languages: ['svelte', 'ts', 'js', 'json', 'sh', 'html', 'css', 'ini']
				}
			})
		})
	]
});
