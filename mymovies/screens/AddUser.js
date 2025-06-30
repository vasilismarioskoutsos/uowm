import React, { useState, useCallback } from 'react';

const AddUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      alert('Όλα τα πεδία είναι υποχρεωτικά');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/adduser.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Ο χρήστης προστέθηκε επιτυχώς');
        setUsername('');
        setPassword('');
      } else {
        alert(result.message || 'Πρόβλημα κατά την προσθήκη χρήστη');
      }
    } catch {
      alert('Σφάλμα σύνδεσης με τον διακομιστή');
    } finally {
      setLoading(false);
    }
  }, [username, password]);

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <input
          style={styles.input}
          placeholder="Όνομα χρήστη"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          style={styles.input}
          placeholder="Κωδικός"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          disabled={loading}
        />
        <button
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Προσθήκη...' : 'Προσθήκη Χρήστη'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formWrapper: {
    maxWidth: 400,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  input: {
    height: 50,
    borderRadius: 8,
    border: '1px solid #888',
    padding: '0 15px',
    fontSize: 18,
    backgroundColor: '#fff',
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#28a745',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#90d7a0',
    cursor: 'not-allowed',
  },
};

export default AddUser;