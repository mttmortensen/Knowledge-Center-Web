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
}

export interface LogEntry {
	LogId: number;
	NodeId: number;
	EntryDate: string;
	Title?: string;
	Content: string;
	Tags: Tag[];
}

export interface LogEntryCreateInput {
	NodeId: number;
	Title?: string;
	Content: string;
	TagIds: number[];
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

// === Learn ===
// EntryType / QuestionStatus / AnswersEntryId / LogId are derived by the API from
// Source on every read; the client re-derives them live with src/lib/learn/parse.ts.

export type LearnEntryType = 'note' | 'image' | 'code' | 'question' | 'followup' | 'log';

export interface LearnSession {
	SessionId: number;
	Title: string;
	Topic: string | null;
	NodeId: number | null;
	NodeTitle: string | null;
	CreatedAt: string;
	UpdatedAt: string;
	EntryCount: number;
	OpenQuestionCount: number;
}

export interface LearnEntry {
	EntryId: number;
	SessionId: number;
	Position: number;
	Source: string;
	CreatedAt: string;
	UpdatedAt: string;
	EntryType: LearnEntryType;
	QuestionStatus: 'open' | 'answered' | null;
	AnswersEntryId: number | null;
	LogId: number | null;
}

export interface LearnSessionDetails extends LearnSession {
	Entries: LearnEntry[];
}

export interface LearnSessionCreateInput {
	Title: string;
	Topic?: string;
	NodeId?: number;
}

/** Only supplied fields change. Empty Topic clears it; NodeId 0 unlinks the node. */
export interface LearnSessionUpdateInput {
	Title?: string;
	Topic?: string;
	NodeId?: number;
}

export interface LearnEntryCreateInput {
	Source: string;
	/** Insert directly above this entry; omit to append. */
	BeforeEntryId?: number;
}

export interface LearnOpenQuestion {
	EntryId: number;
	SessionId: number;
	SessionTitle: string;
	Source: string;
	CreatedAt: string;
}
