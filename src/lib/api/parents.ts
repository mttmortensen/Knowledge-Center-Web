import { knowledgeNodesApi } from './knowledgeNodes';
import { domainsApi } from './domains';
import type { Domain, KnowledgeNode } from '$lib/types/api';

export interface ParentContext {
	node: KnowledgeNode | null;
	domain: Domain | null;
}

/**
 * Loads the knowledge node (and its domain) that owns a log entry or action.
 * Supplementary context only, so failures degrade to nulls instead of throwing.
 */
export async function loadParentContext(nodeId: number): Promise<ParentContext> {
	let node: KnowledgeNode | null = null;
	try {
		node = await knowledgeNodesApi.getById(nodeId);
	} catch {
		return { node: null, domain: null };
	}

	try {
		return { node, domain: await domainsApi.getById(node.DomainId) };
	} catch {
		return { node, domain: null };
	}
}
