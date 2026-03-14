import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>
          ProctorVault
        </Link>
        <div style={styles.navRight}>
          {user ? (
            <>
              {user.persona === 'Admin' && (
                <>
                  <Link to="/admin/dashboard" style={styles.navLink}>
                    Dashboard
                  </Link>
                  <Link to="/admin/subjects" style={styles.navLink}>
                    Subjects
                  </Link>
                  <Link to="/admin/questions" style={styles.navLink}>
                    Questions
                  </Link>
                </>
              )}
              {user.persona === 'Student' && (
                <Link to="/student/dashboard" style={styles.navLink}>
                  Dashboard
                </Link>
              )}
              <span style={styles.userName}>
                Welcome, {user.name} ({user.persona})
              </span>
              <button onClick={logout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/register" style={styles.link}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#333',
    color: 'white',
    padding: '15px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: '24px',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: 'white',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '14px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 15px',
    border: '1px solid white',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '10px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Navbar;
