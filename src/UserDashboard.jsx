import React, { useEffect } from 'react';
import { Container, Alert, Button, Row, Col, Image, Card } from 'react-bootstrap';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import PokeHallLogo from './assets/PokeHall-Logo.svg';

export default function UserDashboard() {
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

  const handleBuildTeam = () => {
    navigate('/build-team');
  };
  
  const handleManageTeams = () => {
    navigate('/team-management');
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col className="text-center">
          <Image 
            src={PokeHallLogo} 
            alt="PokeHall Logo" 
            fluid 
            style={{ maxHeight: '120px' }}
            className="mb-3"
          />
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={8} lg={6} className="mx-auto">
          <h2 className="text-center mb-4">Trainer Dashboard</h2>
          <Alert variant="info" className="shadow-sm">
            Welcome, Trainer! You can view and manage your teams here.
          </Alert>

          <div className="mt-5">
            <Row className="g-4">
              <Col xs={12}>
                <Card 
                  className="shadow-sm border-0 bg-gradient" 
                  style={{ background: 'linear-gradient(135deg, #4e73df 0%, #224abe 100%)' }}
                >
                  <Card.Body className="text-white">
                    <Card.Title>Build Pokémon Team</Card.Title>
                    <Card.Text>Create a new team with your favorite Pokémon</Card.Text>
                    <Button 
                      className="w-100 fw-bold" 
                      onClick={handleBuildTeam}
                      style={{ 
                        background: 'linear-gradient(90deg, #FF9966 0%, #FF5E62 100%)',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s',
                        color: 'white'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Start Building
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col xs={12}>
                <Card 
                  className="shadow-sm border-0 bg-gradient" 
                  style={{ background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)' }}
                >
                  <Card.Body className="text-white">
                    <Card.Title>Manage My Teams</Card.Title>
                    <Card.Text>View and edit your existing Pokémon teams</Card.Text>
                    <Button 
                      className="w-100 fw-bold" 
                      onClick={handleManageTeams}
                      style={{ 
                        background: 'linear-gradient(90deg, #36D1DC 0%, #5B86E5 100%)',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s',
                        color: 'white'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      View Teams
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col xs={12} className="mt-3">
                <Button 
                  size="lg" 
                  className="w-100 fw-bold" 
                  onClick={handleLogout}
                  style={{ 
                    background: 'linear-gradient(90deg, #FF416C 0%, #FF4B2B 100%)',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s',
                    color: 'white'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Logout
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Container>
  );
}