import React, { useEffect } from 'react';
import { Container, Alert, Button, Row, Col } from 'react-bootstrap';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
      } else {
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = () => {
          window.history.pushState(null, null, window.location.href);
        };
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <Container className="py-5">
      <Row>
        <Col xs={12} md={8} lg={6} className="mx-auto">
          <h2 className="text-center">Admin Dashboard</h2>
          <Alert variant="info">Welcome, Admin! You can manage users and settings here.</Alert>
          <Button variant="danger" block onClick={handleLogout}>Logout</Button>
        </Col>
      </Row>
    </Container>
  );
}
