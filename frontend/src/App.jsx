import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadSessionAndLinks = async () => {
    setError('');

    try {
      const sessionRes = await fetch('http://localhost:3001/api/session', {
        credentials: 'include'
      });

      if (sessionRes.status === 401) {
        setUser(null);
        setLinks([]);
        return;
      }

      if (!sessionRes.ok) {
        throw new Error(`Session fetch failed: ${sessionRes.status}`);
      }

      const sessionData = await sessionRes.json();

      if (sessionData.loggedIn) {
        setUser(sessionData.user);

        const linksRes = await fetch('http://localhost:3001/api/links', {
          credentials: 'include'
        });

        if (!linksRes.ok) {
          throw new Error(`Links fetch failed: ${linksRes.status}`);
        }

        const linksData = await linksRes.json();
        setLinks(Array.isArray(linksData) ? linksData : []);
      } else {
        setUser(null);
        setLinks([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSessionAndLinks();
      setLoading(false);
    };

    loadData();
  }, []);

  const handleRegister = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setMessage(data.message || 'Registration successful.');
      setPassword('');
      await loadSessionAndLinks();
    } catch (err) {
      console.error('Register error:', err);
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setMessage(data.message || 'Login successful.');
      setPassword('');
      await loadSessionAndLinks();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Logout failed.');
      }

      setMessage(data.message || 'Logout successful.');
      setUser(null);
      setLinks([]);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  const handleAddLink = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle,
          url: newUrl,
          notes: newNotes,
          tags: newTags
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add link.');
      }

      setMessage('Link added successfully.');
      setNewTitle('');
      setNewUrl('');
      setNewNotes('');
      setNewTags('');

      await loadSessionAndLinks();
    } catch (err) {
      console.error('Add link error:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>LinkLibrarian</h1>

      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={handleLogout}>Logout</button>

          <h2>Add Link</h2>
          <div>
            <div>
              <label htmlFor="newTitle">Title: </label>
              <input
                id="newTitle"
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="newUrl">URL: </label>
              <input
                id="newUrl"
                type="text"
                value={newUrl}
                onChange={(event) => setNewUrl(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="newNotes">Notes: </label>
              <textarea
                id="newNotes"
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="newTags">Tags: </label>
              <input
                id="newTags"
                type="text"
                value={newTags}
                onChange={(event) => setNewTags(event.target.value)}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button onClick={handleAddLink}>Add Link</button>
            </div>
          </div>

          <h2>Links</h2>
          {links.length === 0 ? (
            <p>No links yet.</p>
          ) : (
            <ul>
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.title}
                  </a>
                  {link.tags && (
                    <span style={{ fontSize: '0.8em' }}> — {link.tags}</span>
                  )}
                  {link.notes && <div>{link.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <p>Not logged in.</p>

          <form>
            <div>
              <label htmlFor="email">Email: </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password">Password: </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button type="button" onClick={handleRegister}>
                Register
              </button>
              <button
                type="button"
                onClick={handleLogin}
                style={{ marginLeft: '0.5rem' }}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;