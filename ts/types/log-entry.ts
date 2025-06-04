export interface LogEntry
{
    LogId: number;
    NodeId: number;
    EntryDate: string;
    Content: string;
    TagId: number;
    Tag: string;
    ContributesToProgress: boolean;
}