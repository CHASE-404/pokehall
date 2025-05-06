import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Container className="py-5">
      <Row>
        <Col xs={12} md={8} lg={6} className="mx-auto">
          <h2 className="text-center">Welcome to PokeHall</h2>
          <p className="text-center">Create your Pokémon teams and share them with friends!</p>
          <div className="d-flex justify-content-center">
            <Button variant="primary" className="mx-2" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="secondary" className="mx-2" onClick={() => navigate('/register')}>
              Register
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
