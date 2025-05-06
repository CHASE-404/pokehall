import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Type colors for badges - enhanced with better contrast
const typeColors = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#F0B6BC',
};

// Text colors for better readability on type badges
const getTextColor = (typeName) => {
  // Types that need dark text for better contrast
  const darkTextTypes = ['normal', 'electric', 'ice', 'fairy', 'ground'];
  return darkTextTypes.includes(typeName) ? '#212529' : '#FFFFFF';
};

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingPokemon, setEditingPokemon] = useState(null);
  const [showPokemonEditModal, setShowPokemonEditModal] = useState(false);
  const [pokemonNickname, setPokemonNickname] = useState('');
  const [pokemonNotes, setPokemonNotes] = useState('');
  
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch user's teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          console.log('No authenticated user found');
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        console.log('Fetching teams for user:', user.uid);
        
        const teamsQuery = query(
          collection(db, 'teams'),
          where('userId', '==', user.uid)
        );

        console.log('Query created, executing...');
        const querySnapshot = await getDocs(teamsQuery);
        console.log('Query results:', querySnapshot.size, 'documents found');
        
        const teamsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Team document:', doc.id);
          console.log('Team data:', data);
          
          // Check both 'pokemons' and 'pokemon' fields
          const pokemonData = data.pokemons || data.pokemon || data.selectedPokemons || [];
          console.log('Pokemon data:', pokemonData);
          
          teamsData.push({
            id: doc.id,
            ...data,
            // Ensure we have a consistent field name for Pokemon data
            pokemons: pokemonData
          });
        });

        console.log('All teams data:', teamsData);
        setTeams(teamsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(`Failed to load teams: ${err.message}`);
        setLoading(false);
      }
    };

    // Only fetch teams when auth state is determined and user is logged in
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchTeams();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (team) => {
    setCurrentTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || '');
    setShowEditModal(true);
  };

  const handleDeleteClick = (team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!currentTeam) return;
      
      const teamRef = doc(db, 'teams', currentTeam.id);
      await updateDoc(teamRef, {
        name: teamName,
        description: teamDescription,
        updatedAt: new Date()
      });

      // Update local state
      setTeams(teams.map(team => 
        team.id === currentTeam.id 
          ? { ...team, name: teamName, description: teamDescription }
          : team
      ));

      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!teamToDelete) return;
      
      await deleteDoc(doc(db, 'teams', teamToDelete.id));
      
      // Update local state
      setTeams(teams.filter(team => team.id !== teamToDelete.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team. Please try again.');
    }
  };

  const handleViewTeam = (team) => {
    // Navigate to a detailed view of the team
    navigate(`/build-team?teamId=${team.id}`);
  };

  const handleBackToDashboard = () => {
    navigate('/user-dashboard');
  };

  const handleViewTeamDetails = (team) => {
    console.log('Viewing team details:', team);
    setSelectedTeam(team);
    setShowTeamDetailsModal(true);
  };

  const handleEditPokemon = (pokemon) => {
    setEditingPokemon(pokemon);
    setPokemonNickname(pokemon.nickname || '');
    setPokemonNotes(pokemon.notes || '');
    setShowPokemonEditModal(true);
  };

  const handleSavePokemonEdit = async () => {
    try {
      if (!editingPokemon || !selectedTeam) return;
      
      // Find the pokemon in the team
      const updatedPokemons = selectedTeam.pokemons.map(p => {
        if (p.name === editingPokemon.name) {
          return {
            ...p,
            nickname: pokemonNickname,
            notes: pokemonNotes
          };
        }
        return p;
      });
      
      // Update in Firestore
      const teamRef = doc(db, 'teams', selectedTeam.id);
      await updateDoc(teamRef, {
        pokemons: updatedPokemons
      });
      
      // Update local state
      const updatedTeams = teams.map(team => {
        if (team.id === selectedTeam.id) {
          return {
            ...team,
            pokemons: updatedPokemons
          };
        }
        return team;
      });
      
      setTeams(updatedTeams);
      setSelectedTeam({
        ...selectedTeam,
        pokemons: updatedPokemons
      });
      
      setShowPokemonEditModal(false);
    } catch (err) {
      console.error('Error updating pokemon:', err);
      setError('Failed to update pokemon. Please try again.');
    }
  };

  // Helper function to render type badges with improved styling
  const renderTypeBadges = (types) => {
    if (!types || !Array.isArray(types) || types.length === 0) return null;
    
    return types.map((typeObj, index) => {
      // Handle different type formats
      const typeName = typeof typeObj === 'string' 
        ? typeObj 
        : typeObj.type 
          ? typeObj.type.name 
          : typeObj.name || 'unknown';
      
      return (
        <Badge 
          key={index} 
          pill 
          style={{ 
            backgroundColor: typeColors[typeName] || '#777', 
            color: getTextColor(typeName),
            margin: '0 2px',
            padding: '5px 10px',
            fontWeight: 'bold',
            textShadow: getTextColor(typeName) === '#FFFFFF' ? '0px 0px 2px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
        </Badge>
      );
    });
  };

  // Helper function to render weakness/resistance badges with improved styling
  const renderEffectivenessBadges = (types, isWeakness = true) => {
    if (!types || !Array.isArray(types) || types.length === 0) return <span>None</span>;
    
    return types.map((type, index) => (
      <Badge 
        key={index} 
        pill 
        style={{ 
          backgroundColor: isWeakness ? '#dc3545' : '#28a745', 
          margin: '0 2px',
          padding: '3px 8px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '0px 0px 2px rgba(0,0,0,0.5)'
        }}
      >
        {typeof type === 'string' 
          ? type.charAt(0).toUpperCase() + type.slice(1)
          : 'Unknown'}
      </Badge>
    ));
  };

  // Calculate Pokemon weaknesses based on types
  const calculatePokemonWeaknesses = (pokemon) => {
    if (!pokemon || !pokemon.types || !Array.isArray(pokemon.types)) {
      return { weaknesses: [], resistances: [], immunities: [] };
    }
    
    // If the pokemon already has calculated weaknesses, use those
    if (pokemon.weaknesses && Array.isArray(pokemon.weaknesses)) {
      return {
        weaknesses: pokemon.weaknesses || [],
        resistances: pokemon.resistances || [],
        immunities: pokemon.immunities || []
      };
    }
    
    // Otherwise calculate them
    const typeEffectiveness = {
      normal: { weaknesses: ['fighting'], resistances: [], immunities: ['ghost'] },
      fire: { weaknesses: ['water', 'ground', 'rock'], resistances: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immunities: [] },
      water: { weaknesses: ['electric', 'grass'], resistances: ['fire', 'water', 'ice', 'steel'], immunities: [] },
      electric: { weaknesses: ['ground'], resistances: ['electric', 'flying', 'steel'], immunities: [] },
      grass: { weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug'], resistances: ['water', 'electric', 'grass', 'ground'], immunities: [] },
      ice: { weaknesses: ['fire', 'fighting', 'rock', 'steel'], resistances: ['ice'], immunities: [] },
      fighting: { weaknesses: ['flying', 'psychic', 'fairy'], resistances: ['bug', 'rock', 'dark'], immunities: [] },
      poison: { weaknesses: ['ground', 'psychic'], resistances: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immunities: [] },
      ground: { weaknesses: ['water', 'grass', 'ice'], resistances: ['poison', 'rock'], immunities: ['electric'] },
      flying: { weaknesses: ['electric', 'ice', 'rock'], resistances: ['grass', 'fighting', 'bug'], immunities: ['ground'] },
      psychic: { weaknesses: ['bug', 'ghost', 'dark'], resistances: ['fighting', 'psychic'], immunities: [] },
      bug: { weaknesses: ['fire', 'flying', 'rock'], resistances: ['grass', 'fighting', 'ground'], immunities: [] },
      rock: { weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'], resistances: ['normal', 'fire', 'poison', 'flying'], immunities: [] },
      ghost: { weaknesses: ['ghost', 'dark'], resistances: ['poison', 'bug'], immunities: ['normal', 'fighting'] },
      dragon: { weaknesses: ['ice', 'dragon', 'fairy'], resistances: ['fire', 'water', 'electric', 'grass'], immunities: [] },
      dark: { weaknesses: ['fighting', 'bug', 'fairy'], resistances: ['ghost', 'dark'], immunities: ['psychic'] },
      steel: { weaknesses: ['fire', 'fighting', 'ground'], resistances: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immunities: ['poison'] },
      fairy: { weaknesses: ['poison', 'steel'], resistances: ['fighting', 'bug', 'dark'], immunities: ['dragon'] },
    };
    
    const weaknesses = new Set();
    const resistances = new Set();
    const immunities = new Set();
    
    // Process each type the Pokémon has
    pokemon.types.forEach(typeObj => {
      // Handle different type formats
      const type = typeof typeObj === 'string' 
        ? typeObj 
        : typeObj.type 
          ? typeObj.type.name 
          : typeObj.name || 'unknown';
      
      const typeData = typeEffectiveness[type];
      
      if (typeData) {
        // Add weaknesses
        typeData.weaknesses.forEach(w => weaknesses.add(w));
        
        // Add resistances
        typeData.resistances.forEach(r => resistances.add(r));
        
        // Add immunities
        typeData.immunities.forEach(i => {
          immunities.add(i);
          // Remove from weaknesses and resistances if immune
          weaknesses.delete(i);
          resistances.delete(i);
        });
      }
    });
    
    // Check for double weaknesses/resistances by looking at both types
    if (pokemon.types.length > 1) {
      const type1 = typeof pokemon.types[0] === 'string' 
        ? pokemon.types[0] 
        : pokemon.types[0].type 
          ? pokemon.types[0].type.name 
          : pokemon.types[0].name || 'unknown';
          
      const type2 = typeof pokemon.types[1] === 'string' 
        ? pokemon.types[1] 
        : pokemon.types[1].type 
          ? pokemon.types[1].type.name 
          : pokemon.types[1].name || 'unknown';
      
      // Process type interactions
      Object.keys(typeEffectiveness).forEach(attackType => {
        const isWeakToType1 = typeEffectiveness[type1]?.weaknesses.includes(attackType);
        const isWeakToType2 = typeEffectiveness[type2]?.weaknesses.includes(attackType);
        const isResistantToType1 = typeEffectiveness[type1]?.resistances.includes(attackType);
        const isResistantToType2 = typeEffectiveness[type2]?.resistances.includes(attackType);
        const isImmuneToType1 = typeEffectiveness[type1]?.immunities.includes(attackType);
        const isImmuneToType2 = typeEffectiveness[type2]?.immunities.includes(attackType);
        
        // Immunity takes precedence
        if (isImmuneToType1 || isImmuneToType2) {
          immunities.add(attackType);
          weaknesses.delete(attackType);
          resistances.delete(attackType);
        }
        // Double weakness
        else if (isWeakToType1 && isWeakToType2) {
          weaknesses.add(attackType);
          resistances.delete(attackType);
        }
        // Weakness and resistance cancel out
        else if ((isWeakToType1 && isResistantToType2) || (isWeakToType2 && isResistantToType1)) {
          weaknesses.delete(attackType);
          resistances.delete(attackType);
        }
        // Double resistance
        else if (isResistantToType1 && isResistantToType2) {
          resistances.add(attackType);
          weaknesses.delete(attackType);
        }
      });
    }
    
    return {
      weaknesses: Array.from(weaknesses),
      resistances: Array.from(resistances),
      immunities: Array.from(immunities)
    };
  };

  // New function to analyze team type coverage
  const analyzeTeamCoverage = (pokemons) => {
    if (!pokemons || !Array.isArray(pokemons) || pokemons.length === 0) {
      return {
        offensiveStrengths: [],
        defensiveStrengths: [],
        defensiveWeaknesses: [],
        uncoveredTypes: []
      };
    }

    // All Pokemon types
    const allTypes = [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice', 
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];

    // Count offensive coverage (types your team can hit super effectively)
    const offensiveCoverage = {};
    // Count defensive weaknesses (types that hit your team super effectively)
    const defensiveWeaknesses = {};
    // Count defensive resistances (types your team resists)
    const defensiveResistances = {};
    // Count immunities (types your team is immune to)
    const defensiveImmunities = {};

    // Initialize counters
    allTypes.forEach(type => {
      offensiveCoverage[type] = 0;
      defensiveWeaknesses[type] = 0;
      defensiveResistances[type] = 0;
      defensiveImmunities[type] = 0;
    });

    // Analyze each Pokemon
    pokemons.forEach(pokemon => {
      // Get the Pokemon's types
      const pokemonTypes = pokemon.types || [];
      
      // Get the Pokemon's weaknesses, resistances, and immunities
      let analysis;
      if (pokemon.weaknesses && Array.isArray(pokemon.weaknesses)) {
        // Use pre-calculated values if available
        analysis = {
          weaknesses: pokemon.weaknesses || [],
          resistances: pokemon.resistances || [],
          immunities: pokemon.immunities || []
        };
      } else {
        // Calculate them if not available
        analysis = calculatePokemonWeaknesses(pokemon);
      }

      // Update defensive counters
      analysis.weaknesses.forEach(type => {
        defensiveWeaknesses[type] = (defensiveWeaknesses[type] || 0) + 1;
      });
      
      analysis.resistances.forEach(type => {
        defensiveResistances[type] = (defensiveResistances[type] || 0) + 1;
      });
      
      analysis.immunities.forEach(type => {
        defensiveImmunities[type] = (defensiveImmunities[type] || 0) + 1;
      });

      // Update offensive counters based on Pokemon types
      // This is a simplified version - in a real app you'd use a more detailed type effectiveness chart
      pokemonTypes.forEach(typeObj => {
        const type = typeof typeObj === 'string' 
          ? typeObj 
          : typeObj.type 
            ? typeObj.type.name 
            : typeObj.name || '';
        
        // Add offensive coverage based on the Pokemon's type
        switch(type) {
          case 'normal':
            // Normal is not super effective against any type
            break;
          case 'fire':
            offensiveCoverage['grass'] += 1;
            offensiveCoverage['ice'] += 1;
            offensiveCoverage['bug'] += 1;
            offensiveCoverage['steel'] += 1;
            break;
          case 'water':
            offensiveCoverage['fire'] += 1;
            offensiveCoverage['ground'] += 1;
            offensiveCoverage['rock'] += 1;
            break;
          case 'electric':
            offensiveCoverage['water'] += 1;
            offensiveCoverage['flying'] += 1;
            break;
          case 'grass':
            offensiveCoverage['water'] += 1;
            offensiveCoverage['ground'] += 1;
            offensiveCoverage['rock'] += 1;
            break;
          case 'ice':
            offensiveCoverage['grass'] += 1;
            offensiveCoverage['ground'] += 1;
            offensiveCoverage['flying'] += 1;
            offensiveCoverage['dragon'] += 1;
            break;
          case 'fighting':
            offensiveCoverage['normal'] += 1;
            offensiveCoverage['ice'] += 1;
            offensiveCoverage['rock'] += 1;
            offensiveCoverage['dark'] += 1;
            offensiveCoverage['steel'] += 1;
            break;
          case 'poison':
            offensiveCoverage['grass'] += 1;
            offensiveCoverage['fairy'] += 1;
            break;
          case 'ground':
            offensiveCoverage['fire'] += 1;
            offensiveCoverage['electric'] += 1;
            offensiveCoverage['poison'] += 1;
            offensiveCoverage['rock'] += 1;
            offensiveCoverage['steel'] += 1;
            break;
          case 'flying':
            offensiveCoverage['grass'] += 1;
            offensiveCoverage['fighting'] += 1;
            offensiveCoverage['bug'] += 1;
            break;
          case 'psychic':
            offensiveCoverage['fighting'] += 1;
            offensiveCoverage['poison'] += 1;
            break;
          case 'bug':
            offensiveCoverage['grass'] += 1;
            offensiveCoverage['psychic'] += 1;
            offensiveCoverage['dark'] += 1;
            break;
          case 'rock':
            offensiveCoverage['fire'] += 1;
            offensiveCoverage['ice'] += 1;
            offensiveCoverage['flying'] += 1;
            offensiveCoverage['bug'] += 1;
            break;
          case 'ghost':
            offensiveCoverage['psychic'] += 1;
            offensiveCoverage['ghost'] += 1;
            break;
          case 'dragon':
            offensiveCoverage['dragon'] += 1;
            break;
          case 'dark':
            offensiveCoverage['psychic'] += 1;
            offensiveCoverage['ghost'] += 1;
            break;
          case 'steel':
            offensiveCoverage['ice'] += 1;
            offensiveCoverage['rock'] += 1;
            offensiveCoverage['fairy'] += 1;
            break;
          case 'fairy':
            offensiveCoverage['fighting'] += 1;
            offensiveCoverage['dragon'] += 1;
            offensiveCoverage['dark'] += 1;
            break;
          default:
            break;
        }
      });
    });

    // Determine top offensive strengths (types your team can hit super effectively)
    const offensiveStrengths = allTypes
      .filter(type => offensiveCoverage[type] > 0)
      .sort((a, b) => offensiveCoverage[b] - offensiveCoverage[a])
      .slice(0, 5);

    // Determine defensive strengths (types your team resists or is immune to)
    const defensiveStrengths = allTypes
      .filter(type => defensiveResistances[type] > 0 || defensiveImmunities[type] > 0)
      .sort((a, b) => {
        const aScore = defensiveResistances[a] + (defensiveImmunities[a] * 2);
        const bScore = defensiveResistances[b] + (defensiveImmunities[b] * 2);
        return bScore - aScore;
      })
      .slice(0, 5);

    // Determine top defensive weaknesses (types that hit your team super effectively)
    const teamWeaknesses = allTypes
      .filter(type => defensiveWeaknesses[type] > 0)
      .sort((a, b) => defensiveWeaknesses[b] - defensiveWeaknesses[a])
      .slice(0, 5);

    // Determine types your team has no coverage against
    const uncoveredTypes = allTypes.filter(type => offensiveCoverage[type] === 0);

    return {
      offensiveStrengths,
      defensiveStrengths,
      defensiveWeaknesses: teamWeaknesses,
      uncoveredTypes
    };
  };

  // ... existing code ...

  // Render team analysis section with improved styling
  const renderTeamAnalysis = (pokemons) => {
    if (!pokemons || pokemons.length === 0) {
      return (
        <Alert variant="info">
          Add Pokémon to your team to see type coverage analysis.
        </Alert>
      );
    }

    const analysis = analyzeTeamCoverage(pokemons);

    return (
      <div className="team-analysis">
        <div className="mb-3">
          <h6>Offensive Strengths:</h6>
          <div>
            {analysis.offensiveStrengths.length > 0 ? (
              analysis.offensiveStrengths.map((type, index) => (
                <Badge 
                  key={index} 
                  pill 
                  style={{ 
                    backgroundColor: typeColors[type] || '#777', 
                    color: getTextColor(type),
                    margin: '0 2px',
                    padding: '5px 10px',
                    fontWeight: 'bold'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))
            ) : (
              <span>None</span>
            )}
          </div>
          <small className="text-muted">Types your team can hit super effectively</small>
        </div>

        <div className="mb-3">
          <h6>Defensive Strengths:</h6>
          <div>
            {analysis.defensiveStrengths.length > 0 ? (
              analysis.defensiveStrengths.map((type, index) => (
                <Badge 
                  key={index} 
                  pill 
                  style={{ 
                    backgroundColor: '#28a745', 
                    color: '#FFFFFF',
                    margin: '0 2px',
                    padding: '5px 10px',
                    fontWeight: 'bold'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))
            ) : (
              <span>None</span>
            )}
          </div>
          <small className="text-muted">Types your team resists or is immune to</small>
        </div>

        <div className="mb-3">
          <h6>Defensive Weaknesses:</h6>
          <div>
            {analysis.defensiveWeaknesses.length > 0 ? (
              analysis.defensiveWeaknesses.map((type, index) => (
                <Badge 
                  key={index} 
                  pill 
                  style={{ 
                    backgroundColor: '#dc3545', 
                    color: '#FFFFFF',
                    margin: '0 2px',
                    padding: '5px 10px',
                    fontWeight: 'bold'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))
            ) : (
              <span>None</span>
            )}
          </div>
          <small className="text-muted">Types that hit your team super effectively</small>
        </div>

        {analysis.uncoveredTypes.length > 0 && (
          <div className="mb-3">
            <h6>Uncovered Types:</h6>
            <div>
              {analysis.uncoveredTypes.map((type, index) => (
                <Badge 
                  key={index} 
                  pill 
                  style={{ 
                    backgroundColor: '#6c757d', 
                    color: '#FFFFFF',
                    margin: '0 2px',
                    padding: '5px 10px',
                    fontWeight: 'bold'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
            <small className="text-muted">Types your team can't hit super effectively</small>
          </div>
        )}
      </div>
    );
  };

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">My Pokémon Teams</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Button 
        variant="secondary" 
        className="mb-4" 
        onClick={handleBackToDashboard}
      >
        Back to Dashboard
      </Button>
      
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : teams.length === 0 ? (
        <Alert variant="info">
          You haven't created any teams yet. Go to "Build Pokémon Team" to create your first team!
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {teams.map((team) => (
            <Col key={team.id}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{team.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {team.game || 'Game not specified'}
                  </Card.Subtitle>
                  <Card.Text>
                    {team.description || 'No description'}
                  </Card.Text>
                  
                  {/* Show Pokemon preview */}
                  {team.pokemons && team.pokemons.length > 0 ? (
                    <div className="mt-3 mb-3">
                      <small className="text-muted d-block mb-2">Team Pokémon:</small>
                      <div className="d-flex flex-wrap">
                        {team.pokemons.map((pokemon, index) => (
                          <div key={index} className="me-2 mb-2 text-center" style={{ maxWidth: '60px' }}>
                            <img 
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`} 
                              alt={pokemon.name}
                              style={{ width: '40px', height: '40px' }}
                            />
                            <div style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {pokemon.nickname || pokemon.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 mb-3">
                      <small className="text-muted">No Pokémon in this team yet</small>
                    </div>
                  )}
                  
                  <Card.Text>
                    <small className="text-muted">
                      Created: {team.createdAt?.toDate ? team.createdAt.toDate().toLocaleDateString() : 
                               team.createdAt instanceof Date ? team.createdAt.toLocaleDateString() : 
                               'Unknown'}
                    </small>
                  </Card.Text>
                  
                  <div className="d-flex justify-content-between mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handleViewTeamDetails(team)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => handleEditClick(team)}
                    >
                      Edit Team
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleDeleteClick(team)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Edit Team Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control 
                type="text" 
                value={teamName} 
                onChange={(e) => setTeamName(e.target.value)} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={teamDescription} 
                onChange={(e) => setTeamDescription(e.target.value)} 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Team Details Modal */}
      <Modal 
        show={showTeamDetailsModal} 
        onHide={() => setShowTeamDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedTeam?.name} {selectedTeam?.game ? `(${selectedTeam.game})` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTeam && (
            <>
              <p><strong>Description:</strong> {selectedTeam.description || 'No description'}</p>
              
              <h5 className="mt-4">Team Analysis</h5>
              <div className="mb-3">
                <strong>Team Strengths and Weaknesses:</strong>
                {renderTeamAnalysis(selectedTeam.pokemons)}
              </div>
              
              <h5 className="mt-4">Pokémon</h5>
              {selectedTeam.pokemons && selectedTeam.pokemons.length > 0 ? (
                <ListGroup>
                  {selectedTeam.pokemons.map((pokemon, index) => {
                    const analysis = calculatePokemonWeaknesses(pokemon);
                    
                    return (
                      <ListGroup.Item key={index} className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`} 
                            alt={pokemon.name}
                            style={{ width: '64px', height: '64px', marginRight: '15px' }}
                          />
                          <div>
                            <h5 className="mb-0">
                              {pokemon.nickname ? `${pokemon.nickname} (${pokemon.name})` : pokemon.name}
                            </h5>
                            <div className="mt-1">
                              {renderTypeBadges(pokemon.types)}
                            </div>
                          </div>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="ms-auto"
                            onClick={() => handleEditPokemon(pokemon)}
                          >
                            Edit
                          </Button>
                        </div>
                        
                        {pokemon.notes && (
                          <div className="mb-2">
                            <strong>Notes:</strong> {pokemon.notes}
                          </div>
                        )}
                        
                        <div className="mt-2">
                          {pokemon.abilities && (
                            <div className="mb-1">
                              <strong>Abilities:</strong> {Array.isArray(pokemon.abilities) ? 
                                pokemon.abilities.map(a => 
                                  a.ability ? a.ability.name.charAt(0).toUpperCase() + a.ability.name.slice(1) : 
                                  a.name ? a.name.charAt(0).toUpperCase() + a.name.slice(1) : 
                                  typeof a === 'string' ? a.charAt(0).toUpperCase() + a.slice(1) : 'Unknown'
                                ).join(', ') : 'Unknown'}
                            </div>
                          )}
                          
                          <div className="mb-1">
                            <strong>Weaknesses:</strong> {renderEffectivenessBadges(analysis.weaknesses, true)}
                          </div>
                          
                          <div className="mb-1">
                            <strong>Resistances:</strong> {renderEffectivenessBadges(analysis.resistances, false)}
                          </div>
                          
                          {analysis.immunities.length > 0 && (
                            <div>
                              <strong>Immunities:</strong> {renderEffectivenessBadges(analysis.immunities, false)}
                            </div>
                          )}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <Alert variant="info">No Pokémon in this team yet.</Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTeamDetailsModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowTeamDetailsModal(false);
              handleViewTeam(selectedTeam);
            }}
          >
            Edit in Team Builder
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pokemon Edit Modal */}
      <Modal show={showPokemonEditModal} onHide={() => setShowPokemonEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit {editingPokemon?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nickname</Form.Label>
              <Form.Control 
                type="text" 
                value={pokemonNickname} 
                onChange={(e) => setPokemonNickname(e.target.value)} 
                placeholder="Give your Pokémon a nickname"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={pokemonNotes} 
                onChange={(e) => setPokemonNotes(e.target.value)} 
                placeholder="Add notes about moves, EVs, etc."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPokemonEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSavePokemonEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}