export interface Domains 
{
    DomainId: number;
    DomainName: string;
    DomainDescription: string;
    DomainStatus: string;
    CreatedAt: string;
    LastUsed: string;
}

export interface KnowledgeNodeInline 
{
    Title: string,
    NodeType: string,
    Status: string    
}

export interface DomainWithKnowledgeNodes extends Domains {
    KnowledgeNodes: KnowledgeNodeInline[];
}