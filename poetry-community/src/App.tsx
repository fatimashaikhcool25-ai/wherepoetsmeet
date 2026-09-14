import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import { ArrowLeft, BarChart3, Bell, BookOpen, Eye, Feather, Heart, Home as HomeIcon, Leaf, Menu, MessageCircle, PenLine, Search, Send, Trash2, Users, X } from 'lucide-react';

type Writer = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  initials: string;
  color: string;
  followers: number;
};
type Comment = { id: string; author: string; initials: string; body: string; createdAt: string };
type Poem = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  theme: string;
  createdAt: string;
  likes: number;
  views: number;
  comments: Comment[];
};
type Draft = { id: string; title: string; body: string; updatedAt: number };
type NotificationItem = { id: string; kind: 'like' | 'comment' | 'view' | 'follow'; title: string; detail: string; createdAt: string; read: boolean };

const writers: Writer[] = [
  { id: 'mara-vale', name: 'Mara Vale', handle: '@maravale', bio: 'Field notes from the edge of the ordinary.', initials: 'MV', color: '#b6a06b', followers: 428 },
  { id: 'jonah-reed', name: 'Jonah Reed', handle: '@jonahreed', bio: 'Learning the weather by heart.', initials: 'JR', color: '#8ea9a0', followers: 267 },
  { id: 'ines-soto', name: 'Ines Soto', handle: '@inessoto', bio: 'Small poems for long afternoons.', initials: 'IS', color: '#c49179', followers: 193 },
  { id: 'theo-wren', name: 'Theo Wren', handle: '@theowren', bio: 'I write towards the light I can almost see.', initials: 'TW', color: '#9f9d78', followers: 351 },
];

const seededPoems: Poem[] = [
  { id: 'after-rain', title: 'After the Rain', body: 'The garden keeps its little secrets—\nwater cupped in the lavender,\na blackbird trying on the morning.\n\nI walk out with empty hands\nand come back carrying\nall this green.', authorId: 'mara-vale', theme: 'weather', createdAt: 'today · 7 min read', likes: 84, views: 312, comments: [{ id: 'c1', author: 'Jonah Reed', initials: 'JR', body: 'The blackbird line stayed with me all morning.', createdAt: '12 min ago' }] },
  { id: 'river-knows', title: 'The River Knows', body: 'Nothing in the river is held for long.\nNot the leaf, not the bright coin of the sky,\nnot even my name when I say it there.\n\nStill, I kneel at the bank\nand tell it everything.', authorId: 'jonah-reed', theme: 'water', createdAt: 'yesterday · 4 min read', likes: 61, views: 188, comments: [] },
  { id: 'late-summer', title: 'Late Summer Inventory', body: 'One cracked cup.\nThree peaches softening on the sill.\nA shirt that smells of sun.\n\nThe whole house leaning\nits warm shoulder\ninto the evening.', authorId: 'ines-soto', theme: 'home', createdAt: '2 days ago · 3 min read', likes: 47, views: 149, comments: [{ id: 'c2', author: 'Mara Vale', initials: 'MV', body: 'A beautiful list of what remains.', createdAt: '1 day ago' }] },
  { id: 'little-light', title: 'Little Light', body: 'At dusk, the windows of the village\nbegin to answer one another.\nA lamp. Then another.\n\nThis is how we learn\nwe are not alone—\nby the small lights we leave on.', authorId: 'theo-wren', theme: 'dusk', createdAt: '3 days ago · 5 min read', likes: 102, views: 426, comments: [] },
];

const seededNotifications: NotificationItem[] = [
  { id: 'notification-1', kind: 'like', title: 'Your poem found a few more hearts.', detail: 'After the Rain received 12 new likes.', createdAt: '18 min ago', read: false },
  { id: 'notification-2', kind: 'comment', title: 'Jonah left a reflection.', detail: '“The blackbird line stayed with me all morning.”', createdAt: '42 min ago', read: false },
  { id: 'notification-3', kind: 'view', title: 'Your words are travelling.', detail: 'After the Rain was read 31 times today.', createdAt: '2 h ago', read: true },
  { id: 'notification-4', kind: 'follow', title: 'A new reader joined your circle.', detail: 'Ines Soto is following your reading life.', createdAt: 'yesterday', read: true },
];

function initials(name: string) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
function getWriter(id: string) { return writers.find((writer) => writer.id === id) ?? writers[0]; }
function draftAge(timestamp: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'saved just now';
  if (minutes < 60) return `saved ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `saved ${hours}h ago`;
  return `saved ${Math.floor(hours / 24)}d ago`;
}
function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) as T : initial; } catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

function Leaves() {
  const leaves = useMemo(() => Array.from({ length: 13 }, (_, index) => ({ left: `${(index * 23 + 7) % 100}%`, delay: `${(index * 1.7) % 9}s`, duration: `${11 + (index % 5)}s`, size: 7 + (index % 4) * 2 })), []);
  return <div className="leaf-stage" aria-hidden="true">{leaves.map((leaf, index) => <span className="leaf" key={index} style={{ left: leaf.left, animationDelay: leaf.delay, animationDuration: leaf.duration, width: leaf.size, height: leaf.size * 1.4 }} />)}</div>;
}

function Avatar({ writer, large = false }: { writer: Writer; large?: boolean }) {
  return <span className={`avatar${large ? ' large' : ''}`} style={{ background: writer.color }} aria-hidden="true">{writer.initials}</span>;
}

function AppShell({ children, following, setFollowing }: { children: React.ReactNode; following: string[]; setFollowing: (value: string[]) => void }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path: string) => path === '/' ? location === '/' : location.startsWith(path);
  const nav = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/search', label: 'Find a poem', icon: Search },
    { href: '/write', label: 'Write', icon: PenLine },
    { href: '/notifications', label: 'Activity', icon: Bell },
    { href: '/profile/mara-vale', label: 'Your circle', icon: Users },
  ];
  return <div className="poetry-app"><Leaves /><div className="shell">
    <aside className="rail">
      <Link href="/" className="mark" data-testid="link-brand">Where Poetry<br />Meets Life<small>a living page</small></Link>
      <div className="rail-rule" />
      <nav className="rail-nav" aria-label="Main navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`rail-link${isActive(href) ? ' active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} strokeWidth={1.5} />{label}</Link>)}</nav>
      <div className="rail-spacer" />
      <div className="rail-note">“A poem is a small room<br />you can carry with you.”</div>
      <div className="rail-user"><span className="avatar">YO</span><span>your reading life<br /><small style={{ color: '#9ba68f' }}>{following.length} writers followed</small></span></div>
    </aside>
    <main className="main">
      <header className="topline"><span className="crumb">{location === '/' ? 'the common room' : location.replace('/', '').replaceAll('-', ' ')}</span><div className="top-actions"><button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={19} /></button><Link href="/write" className="button small" data-testid="link-top-write"><Feather size={13} style={{ marginRight: 7, verticalAlign: '-2px' }} />leave a line</Link></div></header>
      {children}
    </main>
  </div>
  <nav className="mobile-nav" aria-label="Mobile navigation">{nav.slice(0, 3).map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} />{label}</Link>)}</nav>
  {mobileOpen && <div role="dialog" aria-label="Navigation menu" style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#3f4d36', padding: 26, color: '#f4ecd9' }}><button className="icon-button" style={{ color: '#f4ecd9', marginLeft: 'auto' }} onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-menu"><X /></button><div style={{ marginTop: 45, display: 'grid', gap: 15 }}>{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ color: '#f4ecd9', font: '28px var(--app-font-serif)', textDecoration: 'none', display: 'flex', gap: 15, alignItems: 'center' }}><Icon size={22} />{label}</Link>)}</div></div>}
  </div>;
}

function LikeButton({ liked, count, onClick, id }: { liked: boolean; count: number; onClick: () => void; id: string }) {
  return <button className={`like-button${liked ? ' liked' : ''}`} onClick={onClick} data-testid={`button-like-${id}`} aria-label={liked ? 'Unlike poem' : 'Like poem'}><Heart size={16} strokeWidth={1.6} />{count}</button>;
}

function PoemCard({ poem, liked, onLike, featured = false }: { poem: Poem; liked: boolean; onLike: (id: string) => void; featured?: boolean }) {
  const writer = getWriter(poem.authorId);
  return <article className={`poem-card${featured ? ' featured' : ''}`} data-testid={`card-poem-${poem.id}`}>
    <div><div className="card-top"><Link href={`/profile/${writer.id}`} className="meta profile-link" data-testid={`link-card-author-${poem.id}`}>{writer.id === 'mara-vale' ? 'poem by feae' : writer.name}</Link><span className="theme">{poem.theme}</span></div><Link href={`/poem/${poem.id}`} style={{ textDecoration: 'none' }}><h3>{poem.title}</h3><div className="excerpt">{poem.body}</div></Link></div>
    <div className="card-actions"><LikeButton liked={liked} count={poem.likes + (liked ? 1 : 0)} onClick={() => onLike(poem.id)} id={poem.id} /><Link href={`/poem/${poem.id}`} className="micro" data-testid={`link-read-${poem.id}`}>{poem.comments.length} reflections · {poem.views ?? 0} reads · {poem.createdAt}</Link></div>
  </article>;
}

function HomePage({ poems, liked, onLike }: { poems: Poem[]; liked: string[]; onLike: (id: string) => void }) {
  const [, setLocation] = useLocation();
  return <div className="page">
    <section className="hero"><div><span className="kicker">a place for the words that find you</span><h1 className="display">Where poetry<br />meets <em>life.</em></h1><p className="hero-copy">Read slowly. Write honestly. Follow the people who notice the same small things you do.</p><form className="hero-search" onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get('query'); setLocation(`/search?q=${encodeURIComponent(String(value ?? ''))}`); }}><Search size={18} style={{ position: 'absolute', left: 16, top: 17, color: '#848575' }} /><input className="search-input" name="query" style={{ paddingLeft: 47 }} placeholder="search poems, writers, or a feeling" aria-label="Search poems, writers, or a feeling" data-testid="input-home-search" /><button className="search-submit" aria-label="Search" data-testid="button-home-search"><ArrowLeft size={17} style={{ transform: 'rotate(180deg)' }} /></button></form></div><aside className="hero-aside"><blockquote>“The page is patient. It waits for the sentence you almost said.”</blockquote><cite>— a note from the common room</cite></aside></section>
    <div className="section-heading"><div><span className="kicker">fresh from the field</span><h2 className="display">For your reading life</h2></div><p>gathered this afternoon</p></div>
    <div className="feed-grid">{poems.map((poem, index) => <PoemCard key={poem.id} poem={poem} liked={liked.includes(poem.id)} onLike={onLike} featured={index === 0} />)}</div>
    <section className="profile-strip"><div><span className="kicker">writer to spend time with</span><h3 className="display">feae</h3><p>field notes from the edge of the ordinary.</p></div><div className="mini-stat">428 followers<br />14 poems shared<br /><Link href="/profile/mara-vale" className="profile-link" data-testid="link-featured-profile">visit her page →</Link></div></section>
  </div>;
}

function SearchPage({ poems, liked, onLike }: { poems: Poem[]; liked: string[]; onLike: (id: string) => void }) {
  const [location, setLocation] = useLocation();
  const query = new URLSearchParams(location.split('?')[1] ?? '').get('q') ?? '';
  const [value, setValue] = useState(query);
  const result = poems.filter((poem) => `${poem.title} ${poem.body} ${poem.theme} ${getWriter(poem.authorId).name}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page search-page"><span className="kicker">the shelf of almost anything</span><h1 className="display">Find a poem.</h1><form className="search-box-large hero-search" onSubmit={(event) => { event.preventDefault(); setLocation(`/search?q=${encodeURIComponent(value)}`); }}><Search size={18} style={{ position: 'absolute', left: 16, top: 17, color: '#848575' }} /><input value={value} onChange={(event) => setValue(event.target.value)} className="search-input" style={{ paddingLeft: 47 }} placeholder="try “rain”, “Mara”, or “the feeling of leaving”" aria-label="Search the poetry shelf" data-testid="input-search-page" /><button className="search-submit" aria-label="Search" data-testid="button-search-page"><ArrowLeft size={17} style={{ transform: 'rotate(180deg)' }} /></button></form>{query ? <div className="section-heading"><div><span className="kicker">showing the soft edges of</span><h2 className="display">“{query}”</h2></div><p>{result.length} {result.length === 1 ? 'poem' : 'poems'} found</p></div> : null}{result.length ? <div className="feed-grid">{result.map((poem, index) => <PoemCard key={poem.id} poem={poem} liked={liked.includes(poem.id)} onLike={onLike} featured={index === 0} />)}</div> : <div className="search-empty"><Leaf size={24} color="#a87554" strokeWidth={1.2} /><h2 className="display">Nothing has landed here yet.</h2><p>Try another word. Poems are shy, but they are rarely far away.</p><button className="button secondary" onClick={() => { setValue(''); setLocation('/search'); }} data-testid="button-clear-search">clear the search</button></div>}</div>;
}

function PoemPage({ poem, liked, onLike, onComment }: { poem: Poem; liked: boolean; onLike: (id: string) => void; onComment: (id: string, text: string) => void }) {
  const writer = getWriter(poem.authorId);
  const [comment, setComment] = useState('');
  return <div className="page poem-detail"><Link href="/" className="back-link" data-testid="link-back-home"><ArrowLeft size={14} /> back to the common room</Link><span className="kicker">{poem.theme} · {poem.createdAt}</span><h1 className="display detail-title">{poem.title}</h1><div className="detail-byline"><Avatar writer={writer} /><span>by <Link href={`/profile/${writer.id}`} className="profile-link" data-testid="link-poem-author">{writer.name}</Link></span></div><div className="detail-body">{poem.body}</div><div className="detail-footer"><LikeButton liked={liked} count={poem.likes + (liked ? 1 : 0)} onClick={() => onLike(poem.id)} id={`detail-${poem.id}`} /><span className="micro"><MessageCircle size={14} style={{ verticalAlign: '-3px', marginRight: 5 }} />{poem.comments.length} reflections</span></div><section className="comment-section"><h2 className="display">Leave a reflection</h2><form className="comment-form" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) { onComment(poem.id, comment.trim()); setComment(''); } }}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What did this poem open in you?" aria-label="Write a reflection" data-testid="textarea-comment" /><button className="button small" type="submit" aria-label="Post reflection" data-testid="button-post-comment"><Send size={15} /></button></form>{poem.comments.length ? poem.comments.map((item) => <div className="comment" key={item.id} data-testid={`comment-${item.id}`}><span className="avatar">{item.initials}</span><div><p>{item.body}</p><small>{item.author} · {item.createdAt}</small></div></div>) : <p className="no-comments">No reflections yet. You could be the first person to leave one.</p>}</section></div>;
}

function ProfilePage({ writer, poems, liked, following, toggleFollow, onLike }: { writer: Writer; poems: Poem[]; liked: string[]; following: string[]; toggleFollow: (id: string) => void; onLike: (id: string) => void }) {
  const authored = poems.filter((poem) => poem.authorId === writer.id);
  const isFollowing = following.includes(writer.id);
   return <div className="page profile-page"><Link href="/" className="back-link" data-testid="link-back-profile"><ArrowLeft size={14} /> back to the common room</Link><header className="profile-header"><Avatar writer={writer} large /><div><span className="kicker">{writer.handle}</span><h1 className="display">{writer.id === 'mara-vale' ? 'Feae' : writer.name}</h1><p>{writer.bio}</p><div className="profile-stats"><span><strong>{writer.followers + (isFollowing ? 1 : 0)}</strong> followers</span><span><strong>{authored.length}</strong> poems</span></div></div><div className="profile-actions"><button className={`button small${isFollowing ? ' secondary' : ''}`} onClick={() => toggleFollow(writer.id)} data-testid="button-follow-writer">{isFollowing ? 'following' : 'follow writer'}</button></div></header><div className="section-heading"><div><span className="kicker">a little archive</span><h2 className="display">{writer.id === 'mara-vale' ? 'Poems by feae' : `Poems by ${writer.name.split(' ')[0]}`}</h2></div></div>{authored.length ? <div className="profile-poems">{authored.map((poem) => <PoemCard key={poem.id} poem={poem} liked={liked.includes(poem.id)} onLike={onLike} />)}</div> : <div className="search-empty"><BookOpen size={22} color="#a87554" /><h2 className="display">The page is still becoming.</h2><p>This writer has not shared a poem here yet.</p></div>}</div>;
}

function NotificationPage({ notifications, poems, following, onReadAll }: { notifications: NotificationItem[]; poems: Poem[]; following: string[]; onReadAll: () => void }) {
  const authored = poems.filter((poem) => poem.authorId === 'mara-vale');
  const totalViews = authored.reduce((sum, poem) => sum + (poem.views ?? 0), 0);
  const totalLikes = authored.reduce((sum, poem) => sum + poem.likes, 0);
  const totalReflections = authored.reduce((sum, poem) => sum + poem.comments.length, 0);
  const iconFor = (kind: NotificationItem['kind']) => {
    if (kind === 'like') return <Heart size={17} />;
    if (kind === 'comment') return <MessageCircle size={17} />;
    if (kind === 'view') return <Eye size={17} />;
    return <Users size={17} />;
  };

  return <div className="page activity-page"><div className="activity-intro"><div><span className="kicker">a small record of what returns</span><h1 className="display">Your activity.</h1><p>See how your words are moving through the common room.</p></div><BarChart3 size={42} strokeWidth={1} className="activity-mark" /></div><div className="dashboard-stats"><div className="dashboard-stat"><Eye size={18} /><strong>{totalViews.toLocaleString()}</strong><span>poem reads</span></div><div className="dashboard-stat"><Heart size={18} /><strong>{totalLikes.toLocaleString()}</strong><span>hearts gathered</span></div><div className="dashboard-stat"><MessageCircle size={18} /><strong>{totalReflections}</strong><span>reflections</span></div><div className="dashboard-stat"><Users size={18} /><strong>{428 + following.length}</strong><span>readers in your circle</span></div></div><section className="notification-panel" aria-labelledby="activity-heading"><div className="section-heading"><div><span className="kicker">the gentle kind of news</span><h2 id="activity-heading" className="display">Notifications</h2></div>{notifications.some((item) => !item.read) ? <button className="text-action" type="button" onClick={onReadAll}>mark all read</button> : <span className="read-note">all caught up</span>}</div>{notifications.length ? <div className="notification-list">{notifications.map((item) => <article className={`notification-item${item.read ? '' : ' unread'}`} key={item.id}><span className={`notification-icon ${item.kind}`}>{iconFor(item.kind)}</span><div><h3>{item.title}</h3><p>{item.detail}</p><small>{item.createdAt}</small></div></article>)}</div> : <div className="draft-empty"><Bell size={19} /><span>When someone responds to your work, it will appear here.</span></div>}</section></div>;
}

function WritePage({ drafts, onSaveDraft, onDeleteDraft, onPublish }: { drafts: Draft[]; onSaveDraft: (id: string | null, title: string, body: string) => string; onDeleteDraft: (id: string) => void; onPublish: (title: string, body: string, draftId: string | null) => void }) {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('your words are saved only on this device.');

  useEffect(() => {
    if (!title.trim() && !body.trim()) return;
    const timer = window.setTimeout(() => {
      const nextId = onSaveDraft(activeDraftId, title, body);
      setActiveDraftId(nextId);
      setSaveStatus('saved just now');
    }, 650);
    return () => window.clearTimeout(timer);
  }, [title, body]);

  const saveDraft = () => {
    if (!title.trim() && !body.trim()) {
      setError('Give your draft a line or a title first.');
      return;
    }
    const nextId = onSaveDraft(activeDraftId, title, body);
    setActiveDraftId(nextId);
    setError('');
    setSaveStatus('saved just now');
  };

  const resumeDraft = (draft: Draft) => {
    setActiveDraftId(draft.id);
    setTitle(draft.title);
    setBody(draft.body);
    setError('');
    setSaveStatus('draft reopened');
  };

  const publishDraft = (draft: Draft) => {
    if (!draft.title.trim() || !draft.body.trim()) {
      resumeDraft(draft);
      setError('Add a title and a few lines before posting.');
      return;
    }
    onPublish(draft.title.trim(), draft.body.trim(), draft.id);
    setLocation('/');
  };

  return <div className="page write-page"><span className="kicker">make a little room</span><h1 className="display">Leave a line.</h1><p>A poem does not need to be finished to be worth sharing.</p><form className="write-form" onSubmit={(event) => { event.preventDefault(); if (!title.trim() || !body.trim()) { setError('A title and a few lines will do.'); return; } onPublish(title.trim(), body.trim(), activeDraftId); setLocation('/'); }}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="title your poem" aria-label="Poem title" data-testid="input-poem-title" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={'Begin anywhere…\n\nThe day is already listening.'} aria-label="Poem body" data-testid="textarea-poem-body" /><div className="write-bottom"><span className="write-tip">{error || saveStatus}</span><div className="write-actions"><button className="button secondary" type="button" onClick={saveDraft} data-testid="button-save-draft">save draft</button><button className="button clay" type="submit" data-testid="button-publish-poem">share this poem <Send size={14} style={{ verticalAlign: '-3px', marginLeft: 6 }} /></button></div></div></form><section className="draft-section" aria-labelledby="drafts-heading"><div className="section-heading"><div><span className="kicker">keep your unfinished thoughts</span><h2 id="drafts-heading" className="display">Saved drafts</h2></div><p>{drafts.length ? `${drafts.length} ${drafts.length === 1 ? 'draft' : 'drafts'}` : 'nothing saved yet'}</p></div>{drafts.length ? <div className="draft-list">{drafts.map((draft) => <article className={`draft-card${draft.id === activeDraftId ? ' active' : ''}`} key={draft.id}><button className="draft-open" type="button" onClick={() => resumeDraft(draft)} data-testid={`button-resume-draft-${draft.id}`}><span className="draft-title">{draft.title.trim() || 'untitled beginning'}</span><span className="draft-excerpt">{draft.body.trim() || 'A blank page still counts as a beginning.'}</span><span className="draft-time">{draftAge(draft.updatedAt)}</span></button><button className="draft-publish" type="button" onClick={() => publishDraft(draft)} data-testid={`button-publish-draft-${draft.id}`}>post</button><button className="draft-delete" type="button" onClick={() => { onDeleteDraft(draft.id); if (draft.id === activeDraftId) { setActiveDraftId(null); setTitle(''); setBody(''); } }} aria-label={`Delete ${draft.title || 'untitled'} draft`} data-testid={`button-delete-draft-${draft.id}`}><Trash2 size={15} /></button></article>)}</div> : <div className="draft-empty"><PenLine size={19} /><span>Your unfinished lines will wait here until they are ready.</span></div>}</section></div>;
}

function AppContent() {
  const [poems, setPoems] = useLocalState<Poem[]>('wpm-poems', seededPoems);
  const [liked, setLiked] = useLocalState<string[]>('wpm-liked', []);
  const [following, setFollowing] = useLocalState<string[]>('wpm-following', []);
  const [drafts, setDrafts] = useLocalState<Draft[]>('wpm-drafts', []);
  const [notifications, setNotifications] = useLocalState<NotificationItem[]>('wpm-notifications', seededNotifications);
  const [toast, setToast] = useState('');
  const [location] = useLocation();
  useEffect(() => {
    const seededViews = new Map(seededPoems.map((poem) => [poem.id, poem.views]));
    setPoems((current) => current.map((poem) => ({ ...poem, views: poem.views ?? seededViews.get(poem.id) ?? 0 })));
  }, []);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const addNotification = (item: Omit<NotificationItem, 'id'>) => setNotifications((current) => [{ ...item, id: `notification-${Date.now()}` }, ...current].slice(0, 24));
  const onLike = (id: string) => {
    const isRemoving = liked.includes(id);
    setLiked((current) => isRemoving ? current.filter((item) => item !== id) : [...current, id]);
    const poem = poems.find((item) => item.id === id);
    if (!isRemoving && poem?.authorId === 'mara-vale') addNotification({ kind: 'like', title: 'Someone liked your poem.', detail: `${poem.title} just received another heart.`, createdAt: 'just now', read: false });
    notify(isRemoving ? 'Removed from your hearts.' : 'Kept in your reading life.');
  };
  const toggleFollow = (id: string) => { setFollowing((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); if (!following.includes(id)) addNotification({ kind: 'follow', title: 'Your circle is growing.', detail: `${getWriter(id).name} is now part of your reading life.`, createdAt: 'just now', read: false }); notify(following.includes(id) ? 'You unfollowed this writer.' : 'Now following this writer.'); };
  const onComment = (id: string, text: string) => { setPoems((current) => current.map((poem) => poem.id === id ? { ...poem, comments: [...poem.comments, { id: `comment-${Date.now()}`, author: 'You', initials: 'YO', body: text, createdAt: 'just now' }] } : poem)); const poem = poems.find((item) => item.id === id); if (poem?.authorId === 'mara-vale') addNotification({ kind: 'comment', title: 'A new reflection arrived.', detail: `You added a reflection to ${poem.title}.`, createdAt: 'just now', read: false }); notify('Your reflection is on the page.'); };
  const onSaveDraft = (id: string | null, title: string, body: string) => {
    const nextId = id ?? `draft-${Date.now()}`;
    const nextDraft = { id: nextId, title, body, updatedAt: Date.now() };
    setDrafts((current) => current.some((draft) => draft.id === nextId) ? current.map((draft) => draft.id === nextId ? nextDraft : draft) : [nextDraft, ...current]);
    return nextId;
  };
  const onDeleteDraft = (id: string) => { setDrafts((current) => current.filter((draft) => draft.id !== id)); notify('Draft removed from your shelf.'); };
  const onPublish = (title: string, body: string, draftId: string | null) => { setPoems((current) => [{ id: `poem-${Date.now()}`, title, body, authorId: 'mara-vale', theme: 'new', createdAt: 'just now · 2 min read', likes: 0, views: 0, comments: [] }, ...current]); if (draftId) setDrafts((current) => current.filter((draft) => draft.id !== draftId)); notify('Your poem has found its place.'); };
  const poemMatch = location.match(/^\/poem\/([^/?]+)/);
  const profileMatch = location.match(/^\/profile\/([^/?]+)/);
  const poem = poemMatch ? poems.find((item) => item.id === poemMatch[1]) : null;
  const writer = profileMatch ? getWriter(profileMatch[1]) : null;
  useEffect(() => {
    if (!poem) return;
    setPoems((current) => current.map((item) => item.id === poem.id ? { ...item, views: (item.views ?? 0) + 1 } : item));
  }, [poem?.id]);
  return <AppShell following={following} setFollowing={setFollowing}>{poem ? <PoemPage poem={poem} liked={liked.includes(poem.id)} onLike={onLike} onComment={onComment} /> : writer ? <ProfilePage writer={writer} poems={poems} liked={liked} following={following} toggleFollow={toggleFollow} onLike={onLike} /> : <Switch><Route path="/search"><SearchPage poems={poems} liked={liked} onLike={onLike} /></Route><Route path="/write"><WritePage drafts={drafts} onSaveDraft={onSaveDraft} onDeleteDraft={onDeleteDraft} onPublish={onPublish} /></Route><Route path="/notifications"><NotificationPage notifications={notifications} poems={poems} following={following} onReadAll={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))} /></Route><Route path="/"><HomePage poems={poems} liked={liked} onLike={onLike} /></Route></Switch>}{toast && <div className="toast" role="status" data-testid="status-toast">{toast}</div>}</AppShell>;
}

function App() { return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppContent /></WouterRouter>; }
export default App;
