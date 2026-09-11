// Mirrors the API's C# models exactly (Program.cs sets PropertyNamingPolicy = null,
// so JSON keys are PascalCase, not camelCase).

export interface Domain {
	DomainId: number;
	DomainName: string;
	DomainDescription: string;
	DomainStatus: string;
	CreatedAt: string;
	LastUsed: string;
	LastUpdated: string;
}

export interface DomainWithKNs extends Domain {
	KnowledgeNodes: KnowledgeNodeInline[];
}

export interface DomainUpdateInput {
	DomainName?: string;
	DomainDescription?: string;
	DomainStatus?: string;
}

export interface KnowledgeNodeInline {
	Id: number;
	Title: string;
	NodeType: string;
	ConfidenceLevel: number;
	Status: string;
	CreatedAt: string;
	LastUpdated: string;
}

export interface KnowledgeNode {
	Id: number;
	Title: string;
	DomainId: number;
	NodeType: string;
	Description: string;
	ConfidenceLevel: number;
	Status: string;
	CreatedAt: string;
	LastUpdated: string;
}

export interface KnowledgeNodeWithLogs extends KnowledgeNode {
	Logs: LogEntryInline[];
}

export interface KnowledgeNodeUpdateInput {
	Title?: string;
	Description?: string;
	Status?: string;
	NodeType?: string;
	ConfidenceLevel?: number;
	DomainId?: number;
}

export interface LogEntryInline {
	LogId: number;
	Title?: string;
	Content: string;
	EntryDate: string;
	ChatURL?: string | null;
}

export interface LogEntry {
	LogId: number;
	NodeId: number;
	EntryDate: string;
	Title?: string;
	Content: string;
	Tags: Tag[];
	ChatURL?: string | null;
}

export interface LogEntryCreateInput {
	NodeId: number;
	Title?: string;
	Content: string;
	TagIds: number[];
	ChatURL?: string | null;
}

export interface LogEntryUpdateInput {
	Title?: string;
	Content?: string;
}

export interface ActionItem {
	Id: number;
	KnowledgeNodeId: number;
	ActionText: string;
	Status: string;
	CreatedAt: string;
	CompletedAt?: string | null;
}

export interface ActionItemCreateInput {
	KnowledgeNodeId: number;
	ActionText: string;
}

export interface ActionItemUpdateInput {
	ActionText?: string;
}

export interface RecentAction extends ActionItem {
	KnowledgeNodeTitle: string;
}

export interface Tag {
	TagId: number;
	Name: string;
}

export interface LoginRequest {
	Username: string;
	Password: string;
}

export interface LoginResponse {
	token: string;
}

export interface DemoLoginResponse {
	token: string;
	isDemo: true;
}

export interface ApiErrorBody {
	message?: string;
}

export interface CtpDayCount {
	Date: string;
	Count: number;
}

export interface EntityCounts {
	Total: number;
	Active: number;
	Archived: number;
}

export interface LogEntryStats {
	Total: number;
	WithTitle: number;
	WithoutTitle: number;
}

export interface ActionStats {
	Total: number;
	Open: number;
	Completed: number;
}

export interface TagStats {
	Total: number;
}

export interface LogStreak {
	CurrentStreak: number;
	LongestStreak: number;
	LastEntryDate: string | null;
}

export interface TagCount {
	TagId: number;
	Name: string;
	Count: number;
}

export interface Stats {
	Domains: EntityCounts;
	KnowledgeNodes: EntityCounts;
	LogEntries: LogEntryStats;
	Actions: ActionStats;
	Tags: TagStats;
	LogStreak: LogStreak;
	ActionStreak: LogStreak;
	CtpByDay: CtpDayCount[];
	ActionsByDay: CtpDayCount[];
	TopTags: TagCount[];
}
