import MarkdownIt from 'markdown-it';

// html: false escapes any raw HTML in an entry, so rendered output is safe to
// {@html}; markdown-it also refuses javascript:/data: link targets by default.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

// Images render with their alt text as a visible caption underneath. Spans (not
// <figure>) because markdown-it places images inside a <p>.
md.renderer.rules.image = (tokens, idx) => {
	const token = tokens[idx];
	const src = md.utils.escapeHtml(token.attrGet('src') ?? '');
	const caption = md.utils.escapeHtml(token.content);
	const img = `<img src="${src}" alt="${caption}" loading="lazy" />`;
	return caption
		? `<span class="learn-figure">${img}<span class="learn-caption">${caption}</span></span>`
		: `<span class="learn-figure">${img}</span>`;
};

// Links open in a new tab so clicking one never leaves the notebook.
const defaultLinkOpen =
	md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
	tokens[idx].attrSet('target', '_blank');
	tokens[idx].attrSet('rel', 'noopener noreferrer');
	return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
	return md.render(source);
}

/** One line of markdown without the wrapping <p>, for previews in lists. */
export function renderInlineMarkdown(source: string): string {
	return md.renderInline(source);
}
