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
	IsArchived: boolean;
	ArchivedAt: string | null;
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
	IsArchived: boolean;
	ArchivedAt: string | null;
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
	IsArchived: boolean;
	ArchivedAt: string | null;
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
	/** Note on what happened after the action was closed; kept if it's reopened. */
	FollowUp?: string | null;
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
// EntryType / QuestionStatus / AnswersEntryId are derived by the API from
// Source on every read; the client re-derives them live with src/lib/learn/parse.ts.

export type LearnEntryType = 'note' | 'image' | 'code' | 'question' | 'followup';

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
	/** The log made from this entry; null once that log is deleted. */
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

// Seasons: time-boxed focus periods. Domains in a season are Focus or Passive;
// domains left out are resting. Stats is null until the season has started.

export type SeasonStatus = 'Planned' | 'Active' | 'Ended';
export type SeasonRole = 'Focus' | 'Passive';
/** Stats also list domains that got work without being in the season. */
export type SeasonStatsRole = SeasonRole | 'Outside';

export interface Season {
	SeasonId: number;
	Name: string;
	Intention: string | null;
	Status: SeasonStatus;
	/** Date only, "YYYY-MM-DD". */
	PlannedStart: string;
	PlannedEnd: string;
	StartedAt: string | null;
	EndedAt: string | null;
	Reflection: string | null;
	OverloadReason: string | null;
	CreatedAt: string;
	UpdatedAt: string;
	FocusCount: number;
	PassiveCount: number;
	DaysPlanned: number;
	/** Null until the season has started. */
	DaysElapsed: number | null;
	/** Only set while Active; 0 once PlannedEnd has passed. */
	DaysRemaining: number | null;
	/** Active and past PlannedEnd. Seasons never end on their own. */
	IsOverdue: boolean;
}

export interface SeasonDomain {
	DomainId: number;
	DomainName: string;
	Role: SeasonRole;
	Note: string | null;
	IsArchived: boolean;
}

export interface SeasonActivityTotals {
	Logs: number;
	ActionsCreated: number;
	ActionsCompleted: number;
	LearnSessions: number;
	LearnEntries: number;
}

export interface SeasonDomainStats {
	DomainId: number;
	DomainName: string;
	Role: SeasonStatsRole;
	Logs: number;
	ActionsCreated: number;
	ActionsCompleted: number;
	LearnEntries: number;
	/** Logs + completed actions + Learn entries. */
	Score: number;
}

export interface SeasonNodeStats extends SeasonDomainStats {
	NodeId: number;
	Title: string;
}

export interface SeasonStats {
	From: string;
	To: string;
	ActiveDays: number;
	/** 0-100: share of scored activity that landed in Focus domains. */
	FocusShare: number;
	Totals: SeasonActivityTotals;
	/** Focus first, then Passive, then Outside; season domains are listed even at zero. */
	ByDomain: SeasonDomainStats[];
	TopKnowledgeNodes: SeasonNodeStats[];
	UnfiledLearnEntries: number;
}

export interface SeasonDetails extends Season {
	Domains: SeasonDomain[];
	Stats: SeasonStats | null;
}

export interface SeasonCreateInput {
	Name: string;
	Intention?: string;
	PlannedStart: string;
	PlannedEnd: string;
}

/** Only supplied fields change. Empty Intention or Reflection clears it. */
export interface SeasonUpdateInput {
	Name?: string;
	Intention?: string;
	PlannedStart?: string;
	PlannedEnd?: string;
	Reflection?: string;
}

export interface SeasonDomainInput {
	DomainId: number;
	Role: SeasonRole;
	Note?: string;
}

export interface SeasonOverloadAck {
	ChallengeToken: string;
	Phrase?: string;
	Reason?: string;
}

export interface SeasonOverloadRequirements {
	ConfirmLabel: string;
	/** When set, the typed phrase must match it (case and spacing don't matter). */
	Phrase: string | null;
	/** When above zero, the reason must be at least this long. */
	ReasonMinLength: number;
	ReasonPrompt: string | null;
	WaitSeconds: number;
	WaitRemainingSeconds: number;
}

/** 409 body from PUT /seasons/{id}/domains when the lineup has more than two Focus domains. */
export interface SeasonOverloadWarning {
	Warning: 'FocusOverload';
	Level: number;
	FocusCount: number;
	FocusDomains: string[];
	Title: string;
	Message: string;
	Consequences: string[];
	Suggestion: string;
	Requires: SeasonOverloadRequirements;
	ChallengeToken: string;
	ChallengeExpiresAt: string;
	/** Set when an ack was sent but didn't satisfy Requires. */
	AckError: string | null;
}
