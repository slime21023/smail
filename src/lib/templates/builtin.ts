import { createBlock, createEmptyState, createSection } from '../core/schema/defaults.js';
import type { EditorState, ParameterDef } from '../core/schema/types.js';

export const BUILTIN_TEMPLATE_IDS = ['newsletter', 'promotion', 'transactional'] as const;
export type BuiltinTemplateId = (typeof BUILTIN_TEMPLATE_IDS)[number];

function addText(section: ReturnType<typeof createSection>, content: string, options: Partial<ReturnType<typeof createBlock<'text'>>['props']> = {}) {
	const block = createBlock('text');
	Object.assign(block.props, options, { content });
	section.columns[0].blocks.push(block);
}

function applyBrand(state: EditorState, templateName: string, subject: string, parameters: ParameterDef[]) {
	state.settings.templateName = templateName;
	state.settings.subject = subject;
	state.settings.preheader = subject;
	state.settings.fontFamily = 'Arial, Helvetica, sans-serif';
	state.settings.backgroundColor = '#f4f7fb';
	state.settings.linkColor = '#1d4ed8';
	state.settings.parameters = parameters;
}

/** Creates a fresh, editable starter template with no shared mutable state. */
export function createBuiltinTemplate(id: BuiltinTemplateId): EditorState {
	const state = createEmptyState();
	const hero = createSection();
	hero.props.backgroundColor = '#ffffff';

	if (id === 'newsletter') {
		applyBrand(state, 'Newsletter', 'Your weekly update', [{ key: 'firstName', label: 'First name', sample: 'Alex' }]);
		addText(hero, '<h1>Hi {{firstName}},</h1><p>Here are this week\'s highlights.</p>', { align: 'center', fontSize: 18 });
		const article = createSection(2);
		article.props.backgroundColor = '#ffffff';
		addText(article, '<h2>Featured story</h2><p>Share a useful update with your readers.</p>');
		article.columns[1].blocks.push(createBlock('image'));
		state.body = [hero, article, footer()];
		return state;
	}

	if (id === 'promotion') {
		applyBrand(state, 'Promotion', 'An offer for {{firstName}}', [
			{ key: 'firstName', label: 'First name', sample: 'Alex' },
			{ key: 'couponCode', label: 'Coupon code', sample: 'WELCOME10' }
		]);
		addText(hero, '<h1>A special offer for {{firstName}}</h1><p>Use code <strong>{{couponCode}}</strong> before it expires.</p>', { align: 'center', fontSize: 20 });
		const button = createBlock('button');
		button.props.text = 'Shop the offer';
		button.props.href = 'https://example.com/offers?code={{couponCode}}';
		hero.columns[0].blocks.push(button);
		state.body = [hero, footer()];
		return state;
	}

	applyBrand(state, 'Transactional update', 'Update for order {{orderNumber}}', [
		{ key: 'firstName', label: 'First name', sample: 'Alex' },
		{ key: 'orderNumber', label: 'Order number', sample: 'SM-1042' }
	]);
	addText(hero, '<h1>Thanks, {{firstName}}</h1><p>Your order <strong>{{orderNumber}}</strong> is being processed.</p>', { fontSize: 18 });
	const details = createSection();
	details.props.backgroundColor = '#ffffff';
	addText(details, '<p>We\'ll send another email when your order is on its way.</p>');
	state.body = [hero, details, footer()];
	return state;
}

function footer() {
	const section = createSection();
	section.props.backgroundColor = '#ffffff';
	section.columns[0].blocks.push(createBlock('divider'), createBlock('social'));
	return section;
}
