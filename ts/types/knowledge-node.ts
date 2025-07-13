export interface LogEntryInline {
    LogId: number;
    Content: string;
    EntryDate: string;
    ContributesToProgress: boolean;
}

export interface KnowledgeNode 
{
    Id: number;
    Title: string;
    DomainId: number;
    NodeType: string;
    Description: string;
    ConfidenceLevel: number;
    Status: string
    CreatedAt: string;
    LastUpdated: string;
}

export interface KnowledgeNodeWithLogs extends KnowledgeNode {
    Logs: LogEntryInline[];
}