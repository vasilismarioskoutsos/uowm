import React, { useState, useCallback } from 'react';

const CreateCategory = () => {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!categoryName.trim()) {
      alert('Το πεδίο δεν μπορεί να είναι κενό');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/create_category.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre_name: categoryName }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Η κατηγορία δημιουργήθηκε επιτυχώς');
        setCategoryName('');
      } else {
        alert(result.message || 'Πρόβλημα κατά τη δημιουργία της κατηγορίας');
      }
    } catch (error) {
      alert('Σφάλμα σύνδεσης με τον διακομιστή');
    } finally {
      setLoading(false);
    }
  }, [categoryName]);

  return (
    <div style={styles.outerContainer}>
      <div style={styles.innerContainer}>
        <h2 style={styles.title}>Δημιουργία Κατηγορίας</h2>
        <input
          style={styles.input}
          placeholder="Όνομα κατηγορίας"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          disabled={loading}
        />
        <button
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Αποστολή...' : 'Δημιουργία Κατηγορίας'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  outerContainer: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 25,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: '0 12px',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 45,
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#9bbcff',
    cursor: 'not-allowed',
  },
};

export default CreateCategory;