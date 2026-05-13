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

  // Check for loading state before rendering the main content.
  if (loading) {
    return <div>Loading...</div>;
  }

  // Main render of the app. Displays user info, link management interface, and handles login/register forms based on authentication state.
  return (
    <div className="App">
      <h1>LinkLibrarian</h1>

      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {user ? ( // If user is logged in, show links and user page content. Otherwise, show login/register form.
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

          <h2>Filter by Tag</h2>
          <div>
            <label htmlFor="tagFilter">Tag Filter: </label>
            <input
              id="tagFilter"
              type="text"
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              placeholder="Type a tag keyword"
            />
            <button
              onClick={() => setTagFilter('')}
              style={{ marginLeft: '0.5rem' }}
            >
              Clear Filter
            </button>
          </div>

          <h2>Links</h2> {/* Section displaying the list of saved links. If no links match the filter, display a "No matching links found." message. */}
          {filteredLinks.length === 0 ? (
            <p>No matching links found.</p>
          ) : (
            <ul>
              {filteredLinks.map((link) => (
                <li key={link.id} style={{ marginBottom: '1rem' }}>
                  {editingLinkId === link.id ? (
                    <div>
                      <div>
                        <label>Title: </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(event) =>
                            setEditForm({
                              ...editForm,
                              title: event.target.value
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>URL: </label>
                        <input
                          type="text"
                          value={editForm.url}
                          onChange={(event) =>
                            setEditForm({
                              ...editForm,
                              url: event.target.value
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Notes: </label>
                        <textarea
                          value={editForm.notes}
                          onChange={(event) =>
                            setEditForm({
                              ...editForm,
                              notes: event.target.value
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Tags: </label>
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(event) =>
                            setEditForm({
                              ...editForm,
                              tags: event.target.value
                            })
                          }
                        />
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <button onClick={() => handleSaveEdit(link.id)}>Save</button>
                        <button
                          onClick={handleCancelEdit}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.title}
                      </a>
                      {link.tags && (
                        <span style={{ fontSize: '0.8em' }}> — {link.tags}</span>
                      )}
                      {link.notes && <div>{link.notes}</div>}

                      {/* Display image thumbnail if one exists for this link */}
                      {link.image_path && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <img
                            src={`${API_BASE_URL}${link.image_path}`}
                            alt={`Image for ${link.title}`}
                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      {/* Image upload controls */}
                      <div style={{ marginTop: '0.5rem' }}>
                        {uploadingLinkId === link.id ? (
                          <div>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif"
                              onChange={(event) => setSelectedImageFile(event.target.files[0])}
                            />
                            <button
                              onClick={() => handleImageUpload(link.id)}
                              style={{ marginLeft: '0.5rem' }}
                            >
                              Upload
                            </button>
                            <button
                              onClick={() => {
                                setUploadingLinkId(null);
                                setSelectedImageFile(null);
                              }}
                              style={{ marginLeft: '0.5rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setUploadingLinkId(link.id);
                              setSelectedImageFile(null);
                            }}
                            style={{ marginTop: '0.25rem' }}
                          >
                            {link.image_path ? 'Change Image' : 'Add Image'}
                          </button>
                        )}
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <button onClick={() => handleStartEdit(link)}>Edit</button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div> {/* Content to display when user is not logged in, showing login and registration form */}
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