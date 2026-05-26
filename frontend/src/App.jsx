import { useEffect, useState } from 'react';

// Main App component for LinkLibrarian.
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
  const [selectedImageFile, setSelectedImageFile] = useState(null); // State to hold the selected image file for upload.
  const [uploadingLinkId, setUploadingLinkId] = useState(null); // State to track which link is currently having an image uploaded (used to show loading state for that specific link).

  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    url: '',
    notes: '',
    tags: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  /*--------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------
  BEGIN HTML RENDERING CODE
  ----------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------
  --------------------------------------------------------------------------------------------------*/

  // Function to filter links based on the tag filter input.
  const [tagFilter, setTagFilter] = useState('');

  const filteredLinks = links.filter((link) => {
    if (!tagFilter.trim()) {
      return true;
    }

    return (link.tags || '')
      .toLowerCase()
      .includes(tagFilter.toLowerCase());
  });

  // Function to load session and links data from the backend.
  const loadSessionAndLinks = async () => {
    setError('');

    try {
      const sessionRes = await fetch(`${API_BASE_URL}/api/session`, {
        credentials: 'include'
      });

      if (sessionRes.status === 401) { // Check for unauthorized status to handle not logged in case
        setUser(null);
        setLinks([]);
        return;
      }

      if (!sessionRes.ok) {
        throw new Error(`Session fetch failed: ${sessionRes.status}`);
      }

      const sessionData = await sessionRes.json();

      if (sessionData.loggedIn) { // If logged in, set user and fetch links
        setUser(sessionData.user);

        const linksRes = await fetch(`${API_BASE_URL}/api/links`, {
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

  // Load session and links on component mount.
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSessionAndLinks();
      setLoading(false);
    };

    loadData();
  }, []);

  // Handler for user registration.
  const handleRegister = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
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

  // Handler for user login.
  const handleLogin = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
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

  // Handler for user logout.
  const handleLogout = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
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
      setEditingLinkId(null);
      setTagFilter('');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  // Handler for adding a new link.
  const handleAddLink = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/links`, {
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

  // Handlers for editing and deleting links.
  const handleStartEdit = (link) => {
    setEditingLinkId(link.id);
    setEditForm({
      title: link.title || '',
      url: link.url || '',
      notes: link.notes || '',
      tags: link.tags || ''
    });
    setError('');
    setMessage('');
  };

  // Handler to cancel editing a link and reset the edit form.
  const handleCancelEdit = () => {
    setEditingLinkId(null);
    setEditForm({
      title: '',
      url: '',
      notes: '',
      tags: ''
    });
  };

  // Handler to save the edited link details and update it in the backend.
  const handleSaveEdit = async (linkId) => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update link.');
      }

      setMessage('Link updated successfully.');
      setEditingLinkId(null);

      await loadSessionAndLinks();
    } catch (err) {
      console.error('Edit link error:', err);
      setError(err.message);
    }
  };

  // Handler to delete a link after confirming with the user and updating the backend.
  const handleDeleteLink = async (linkId) => {
    setError('');
    setMessage('');

    const confirmDelete = window.confirm('Are you sure you want to delete this link?');

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete link.');
      }

      setMessage('Link deleted successfully.');

      if (editingLinkId === linkId) {
        setEditingLinkId(null);
      }

      await loadSessionAndLinks();
    } catch (err) {
      console.error('Delete link error:', err);
      setError(err.message);
    }
  };

  // Handler to upload an image for a specific link.
  const handleImageUpload = async (linkId) => {
    setError('');
    setMessage('');

    if (!selectedImageFile) {
      setError('Please select an image file first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${linkId}/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Image upload failed.');
      }

      setMessage('Image uploaded successfully.');
      setSelectedImageFile(null);
      setUploadingLinkId(null);
      await loadSessionAndLinks();
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message);
    }
  };

  /*--------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------
  BEGIN HTML RENDERING CODE
  ----------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------
  --------------------------------------------------------------------------------------------------*/

    // Show loading state while fetching session and links data.
    if (loading) {
    return <div className="app-loading">Loading…</div>;
  }

  return (
    <div className="App">
      {/* ── TOP NAV BAR ── */}
      <header className="app-header">
        <h1>LinkLibrarian</h1>
        <div className="header-center">
          {error   && <span className="app-error">Error: {error}</span>}
          {message && <span className="app-message">{message}</span>}
        </div>
        <div className="header-right">
          {user && (
            <>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                {user.email}
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </header>

      {user ? ( // If user is logged in, show the main app interface; otherwise, show login/register form.
        <div className="app-body">

          {/* ── ADD LINK SECTION ── */}
          <section className="add-link-section">
            <h2>Add Link</h2>
            <div className="add-link-form">
              <label htmlFor="newTitle">Title:</label>
              <input
                id="newTitle"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <label htmlFor="newUrl">URL:</label>
              <input
                id="newUrl"
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />

              <label htmlFor="newNotes">Notes:</label>
              <textarea
                id="newNotes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />

              <label htmlFor="newTags">Tags:</label>
              <input
                id="newTags"
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />

              <div className="add-link-actions">
                <button onClick={handleAddLink}>Add Link</button>
              </div>
            </div>
          </section>

          {/* ── LINKS SECTION ── */}
          <section className="links-section">
            <div className="links-toolbar">
              <span className="toolbar-title">Links</span>
              <div className="toolbar-divider" />
              <span className="filter-label">Filter by Tag:</span>
              <input
                className="filter-input"
                id="tagFilter"
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Type a tag keyword"
              />
              <button className="clear-btn" onClick={() => setTagFilter('')}>
                Clear
              </button>
            </div>
            <div className="links-divider" />

            {filteredLinks.length === 0 ? (
              <div className="links-grid">
                <p className="links-empty">No matching links found.</p>
              </div>
            ) : (
              <div className="links-grid">
                {filteredLinks.map((link) => (
                  <div className="link-card" key={link.id}>

                    {/* Image or placeholder */}
                    {link.image_path ? (
                      <img
                        className="link-card-image"
                        src={`${API_BASE_URL}${link.image_path}`}
                        alt={`Image for ${link.title}`}
                      />
                    ) : (
                      <div className="link-card-image-placeholder">
                        No image uploaded
                      </div>
                    )}

                    {editingLinkId === link.id ? (
                      /* ── EDIT MODE ── */
                      <div className="link-card-edit">
                        <div>
                          <label>Title:</label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label>URL:</label>
                          <input
                            type="text"
                            value={editForm.url}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          />
                        </div>
                        <div>
                          <label>Notes:</label>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          />
                        </div>
                        <div>
                          <label>Tags:</label>
                          <input
                            type="text"
                            value={editForm.tags}
                            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          />
                        </div>
                        <div className="link-card-edit-actions">
                          <button onClick={() => handleSaveEdit(link.id)}>Save</button>
                          <button onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <>
                        {/* Upload / Change Image controls */}
                        <div className="link-card-actions">
                          {uploadingLinkId === link.id ? (
                            <div className="link-card-upload">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif"
                                onChange={(e) => setSelectedImageFile(e.target.files[0])}
                              />
                              <div className="upload-btns">
                                <button onClick={() => handleImageUpload(link.id)}>Upload</button>
                                <button onClick={() => { setUploadingLinkId(null); setSelectedImageFile(null); }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setUploadingLinkId(link.id); setSelectedImageFile(null); }}>
                              {link.image_path ? 'Change Image' : 'Upload Image'}
                            </button>
                          )}
                          <button onClick={() => handleStartEdit(link)}>Edit</button>
                          <button onClick={() => handleDeleteLink(link.id)}>Delete</button>
                        </div>

                        {/* Title + tags + notes */}
                        <div className="link-card-info">
                          <div className="link-card-title-row">
                            <a href={link.url} target="_blank" rel="noreferrer">
                              {link.title}
                            </a>
                            {link.tags && (
                              <span className="link-card-tags">— {link.tags}</span>
                            )}
                          </div>
                          {link.notes && (
                            <div className="link-card-notes">{link.notes}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      ) : (
        /* ── LOGIN / REGISTER ── */
        <div className="auth-page">
          <h2>Sign in to LinkLibrarian</h2>
          <form className="auth-form">
            <div>
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="auth-actions">
              <button type="button" onClick={handleRegister}>Register</button>
              <button type="button" onClick={handleLogin}>Login</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;