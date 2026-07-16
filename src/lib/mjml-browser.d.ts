declare module 'mjml-browser' {
	export interface MjmlError {
		line: number;
		message: string;
		tagName: string;
		formattedMessage: string;
	}

	export interface Mjml2HtmlOptions {
		fonts?: Record<string, string>;
		keepComments?: boolean;
		validationLevel?: 'strict' | 'soft' | 'skip';
	}

	export interface Mjml2HtmlResult {
		html: string;
		errors: MjmlError[];
	}

	export default function mjml2html(mjml: string, options?: Mjml2HtmlOptions): Mjml2HtmlResult;
}
