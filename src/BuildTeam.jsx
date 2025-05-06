import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Modal, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#F0B6BC',
};

// Type effectiveness chart
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

export default function BuildTeam() {
  const [selectedGame, setSelectedGame] = useState('HeartGold');
  const [dexType, setDexType] = useState('regional');
  const [pokemons, setPokemons] = useState([]);
  const [resolvedPokemonData, setResolvedPokemonData] = useState([]);
  const [selectedPokemons, setSelectedPokemons] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedPokemon, setAddedPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchTriggered, setFetchTriggered] = useState(false);
  const [teamAnalysisVisible, setTeamAnalysisVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const navigate = useNavigate();

  // New state for nickname and notes
  const [pokemonNicknames, setPokemonNicknames] = useState({});
  const [pokemonNotes, setPokemonNotes] = useState({});
  const [editingPokemon, setEditingPokemon] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const games = {
    "HeartGold": { region: "Johto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/7/", maxNationalId: 493 },
    "SoulSilver": { region: "Johto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/7/", maxNationalId: 493 },
    "FireRed": { region: "Kanto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/2/", maxNationalId: 386 },
    "LeafGreen": { region: "Kanto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/2/", maxNationalId: 386 },
    "Ruby": { region: "Hoenn", regionalUrl: "https://pokeapi.co/api/v2/pokedex/4/", maxNationalId: 386 },
    "Sapphire": { region: "Hoenn", regionalUrl: "https://pokeapi.co/api/v2/pokedex/4/", maxNationalId: 386 },
    "Emerald": { region: "Hoenn", regionalUrl: "https://pokeapi.co/api/v2/pokedex/4/", maxNationalId: 386 },
    "Diamond": { region: "Sinnoh", regionalUrl: "https://pokeapi.co/api/v2/pokedex/5/", maxNationalId: 493 },
    "Pearl": { region: "Sinnoh", regionalUrl: "https://pokeapi.co/api/v2/pokedex/5/", maxNationalId: 493 },
    "Platinum": { region: "Sinnoh", regionalUrl: "https://pokeapi.co/api/v2/pokedex/6/", maxNationalId: 493 },
    "Red": { region: "Kanto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/2/", maxNationalId: 386 },
    "Blue": { region: "Kanto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/2/", maxNationalId: 386 },
    "Yellow": { region: "Kanto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/2/", maxNationalId: 386 },
    "Gold": { region: "Johto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/3/", maxNationalId: 493 },
    "Silver": { region: "Johto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/3/", maxNationalId: 493 },
    "Crystal": { region: "Johto", regionalUrl: "https://pokeapi.co/api/v2/pokedex/3/", maxNationalId: 493 },
  };

  const fetchPokemons = async () => {
    setLoading(true);
    try {
      let dexData;

      if (dexType === 'regional') {
        const res = await axios.get(games[selectedGame].regionalUrl);
        dexData = res.data.pokemon_entries;
      } else {
        const res = await axios.get('https://pokeapi.co/api/v2/pokedex/1/');
        const maxId = games[selectedGame].maxNationalId;
        dexData = res.data.pokemon_entries.filter(p => p.entry_number <= maxId);
      }

      setPokemons(dexData);
    } catch (err) {
      console.error("Error fetching Pokémon data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchTriggered) {
      fetchPokemons();
    }
  }, [selectedGame, dexType, fetchTriggered]);

  useEffect(() => {
    const resolveAllPokemonData = async () => {
      const results = await Promise.all(
        pokemons.map(async (entry) => {
          try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${entry.pokemon_species.name}`);
            return {
              id: res.data.id,
              name: res.data.name,
              types: res.data.types,
              abilities: res.data.abilities,
            };
          } catch (err) {
            console.error(`Error resolving Pokémon ${entry.pokemon_species.name}`, err);
            return null;
          }
        })
      );
      setResolvedPokemonData(results.filter(Boolean));
    };

    if (pokemons.length > 0) {
      resolveAllPokemonData();
    }
  }, [pokemons]);

  const handleGameChange = (e) => setSelectedGame(e.target.value);
  const handleDexTypeChange = (e) => setDexType(e.target.value);
  const handleFetchData = () => setFetchTriggered(true);

  const addPokemonToTeam = (pokemon) => {
    if (selectedPokemons.length < 6) {
      // Add complete pokemon data instead of just the name
      const fullPokemonData = resolvedPokemonData.find(p => p.name === pokemon.name);
      setSelectedPokemons([...selectedPokemons, fullPokemonData]);
      setAddedPokemon(fullPokemonData);
      setModalVisible(true);
      setTimeout(() => setModalVisible(false), 3000);
    } else {
      alert("You can only select up to 6 Pokémon.");
    }
  };

  const removePokemonFromTeam = (index) => {
    const updatedTeam = [...selectedPokemons];
    updatedTeam.splice(index, 1);
    setSelectedPokemons(updatedTeam);
    
    // Remove nickname and notes if they exist
    const pokemonName = selectedPokemons[index].name;
    const updatedNicknames = { ...pokemonNicknames };
    const updatedNotes = { ...pokemonNotes };
    
    if (updatedNicknames[pokemonName]) {
      delete updatedNicknames[pokemonName];
      setPokemonNicknames(updatedNicknames);
    }
    
    if (updatedNotes[pokemonName]) {
      delete updatedNotes[pokemonName];
      setPokemonNotes(updatedNotes);
    }
  };

  const openEditModal = (pokemon) => {
    setEditingPokemon(pokemon);
    setEditModalVisible(true);
  };

  const handleNicknameChange = (e) => {
    const { value } = e.target;
    if (editingPokemon) {
      setPokemonNicknames({
        ...pokemonNicknames,
        [editingPokemon.name]: value
      });
    }
  };

  const handleNotesChange = (e) => {
    const { value } = e.target;
    if (editingPokemon) {
      setPokemonNotes({
        ...pokemonNotes,
        [editingPokemon.name]: value
      });
    }
  };

  const calculatePokemonWeaknesses = (pokemon) => {
    if (!pokemon || !pokemon.types) return { weaknesses: [], resistances: [], immunities: [] };
    
    const weaknesses = new Set();
    const resistances = new Set();
    const immunities = new Set();
    
    // Process each type the Pokémon has
    pokemon.types.forEach(typeObj => {
      const type = typeObj.type.name;
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
      const type1 = pokemon.types[0].type.name;
      const type2 = pokemon.types[1].type.name;
      
      // Process type interactions
      Object.keys(typeEffectiveness).forEach(attackType => {
        const isWeakToType1 = typeEffectiveness[type1].weaknesses.includes(attackType);
        const isWeakToType2 = typeEffectiveness[type2].weaknesses.includes(attackType);
        const isResistantToType1 = typeEffectiveness[type1].resistances.includes(attackType);
        const isResistantToType2 = typeEffectiveness[type2].resistances.includes(attackType);
        const isImmuneToType1 = typeEffectiveness[type1].immunities.includes(attackType);
        const isImmuneToType2 = typeEffectiveness[type2].immunities.includes(attackType);
        
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

  const calculateTeamWeaknesses = () => {
    if (selectedPokemons.length === 0) return { weaknesses: [], resistances: [], immunities: [] };
    
    // Count how many Pokémon are weak to, resistant to, or immune to each type
    const weaknessCount = {};
    const resistanceCount = {};
    const immunityCount = {};
    
    // Initialize counts for all types
    Object.keys(typeEffectiveness).forEach(type => {
      weaknessCount[type] = 0;
      resistanceCount[type] = 0;
      immunityCount[type] = 0;
    });
    
    // Calculate for each Pokémon
    selectedPokemons.forEach(pokemon => {
      const analysis = calculatePokemonWeaknesses(pokemon);
      
      analysis.weaknesses.forEach(type => {
        weaknessCount[type]++;
      });
      
      analysis.resistances.forEach(type => {
        resistanceCount[type]++;
      });
      
      analysis.immunities.forEach(type => {
        immunityCount[type]++;
      });
    });
    
    // Determine team weaknesses (types that more than half the team is weak to)
    const teamSize = selectedPokemons.length;
    const teamWeaknesses = Object.keys(weaknessCount).filter(
      type => weaknessCount[type] > Math.floor(teamSize / 2)
    );
    
    // Determine team resistances (types that more than half the team resists)
    const teamResistances = Object.keys(resistanceCount).filter(
      type => resistanceCount[type] > Math.floor(teamSize / 2)
    );
    
    // Determine team immunities (types that at least one team member is immune to)
    const teamImmunities = Object.keys(immunityCount).filter(
      type => immunityCount[type] > 0
    );
    
    return {
      weaknesses: teamWeaknesses,
      resistances: teamResistances,
      immunities: teamImmunities,
      weaknessCount,
      resistanceCount,
      immunityCount
    };
  };

  const saveTeamToFirebase = async () => {
    if (selectedPokemons.length === 0) {
      alert("Please add at least one Pokémon to your team before saving.");
      return;
    }
    
    if (!teamName.trim()) {
      alert("Please give your team a name.");
      return;
    }
    
    setSavingTeam(true);
    setSaveError('');
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setSaveError("You must be logged in to save a team.");
        setSavingTeam(false);
        return;
      }
      
      // Format team data for Firestore
      const teamData = {
        name: teamName,
        description: teamDescription,
        game: selectedGame,
        dexType: dexType,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        pokemon: selectedPokemons.map(pokemon => ({
          id: pokemon.id,
          name: pokemon.name,
          nickname: pokemonNicknames[pokemon.name] || '',
          notes: pokemonNotes[pokemon.name] || '',
          types: pokemon.types.map(t => t.type.name),
          abilities: pokemon.abilities.map(a => a.ability.name),
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
        }))
      };
      
      // Add team analysis data
      const teamAnalysis = calculateTeamWeaknesses();
      teamData.analysis = {
        weaknesses: teamAnalysis.weaknesses,
        resistances: teamAnalysis.resistances,
        immunities: teamAnalysis.immunities
      };
      
      // Save to Firestore
      await addDoc(collection(db, "teams"), teamData);
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
         navigate('/user-dashboard');
      }, 3000);
    } catch (error) {
      console.error("Error saving team:", error);
      setSaveError(`Error saving team: ${error.message}`);
    } finally {
      setSavingTeam(false);
    }
  };

  const handleLogout = () => navigate('/login');

  const renderPokemonList = () => {
    return resolvedPokemonData.map((pokemon) => (
      <Col key={pokemon.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
        <Card>
          <Card.Img
            variant="top"
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
            alt={pokemon.name}
            style={{ height: '150px', objectFit: 'contain' }}
          />
          <Card.Body>
            <Card.Title>{pokemon.name}</Card.Title>
            <div>
              {pokemon.types.map((type) => (
                <span
                  key={type.type.name}
                  className="badge me-1"
                  style={{ backgroundColor: typeColors[type.type.name] }}
                >
                  {type.type.name}
                </span>
              ))}
            </div>
            <div><strong>Abilities:</strong> {pokemon.abilities.map(a => a.ability.name).join(', ')}</div>
            <Button
              variant="primary"
              onClick={() => addPokemonToTeam(pokemon)}
              className="w-100 mt-2"
            >
              Add to Team
            </Button>
          </Card.Body>
        </Card>
      </Col>
    ));
  };

  const renderSelectedTeam = () => {
    if (selectedPokemons.length === 0) {
      return <p>No Pokémon selected yet. Add up to 6 Pokémon to your team.</p>;
    }

    return (
      <>
        <h3 className="mt-4 mb-3">Your Team</h3>
        <Row>
          {selectedPokemons.map((pokemon, index) => {
            const weaknessAnalysis = calculatePokemonWeaknesses(pokemon);
            
            return (
              <Col key={`team-${index}`} xs={12} sm={6} md={4} className="mb-4">
                <Card>
                  <Card.Img
                    variant="top"
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                    alt={pokemon.name}
                    style={{ height: '150px', objectFit: 'contain' }}
                  />
                  <Card.Body>
                    <Card.Title>
                      {pokemonNicknames[pokemon.name] ? 
                        `${pokemonNicknames[pokemon.name]} (${pokemon.name})` : 
                        pokemon.name}
                    </Card.Title>
                    
                    <div className="mb-2">
                      {pokemon.types.map((type) => (
                        <span
                          key={type.type.name}
                          className="badge me-1"
                          style={{ backgroundColor: typeColors[type.type.name] }}
                        >
                          {type.type.name}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mb-2"><strong>Abilities:</strong> {pokemon.abilities.map(a => a.ability.name).join(', ')}</div>
                    
                    {pokemonNotes[pokemon.name] && (
                      <div className="mb-2">
                        <strong>Notes:</strong> {pokemonNotes[pokemon.name]}
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <strong>Weaknesses:</strong>{' '}
                      {weaknessAnalysis.weaknesses.length > 0 ? 
                        weaknessAnalysis.weaknesses.map(type => (
                          <Badge 
                            key={type} 
                            bg="danger" 
                            className="me-1"
                            style={{ backgroundColor: typeColors[type] }}
                          >
                            {type}
                          </Badge>
                        )) : 
                        'None'
                      }
                    </div>
                    
                    <div className="mb-2">
                      <strong>Resistances:</strong>{' '}
                      {weaknessAnalysis.resistances.length > 0 ? 
                        weaknessAnalysis.resistances.map(type => (
                          <Badge 
                            key={type} 
                            bg="success" 
                            className="me-1"
                            style={{ backgroundColor: typeColors[type] }}
                          >
                            {type}
                          </Badge>
                        )) : 
                        'None'
                      }
                    </div>
                    
                    <div className="mb-3">
                      <strong>Immunities:</strong>{' '}
                      {weaknessAnalysis.immunities.length > 0 ? 
                        weaknessAnalysis.immunities.map(type => (
                          <Badge 
                            key={type} 
                            bg="info" 
                            className="me-1"
                            style={{ backgroundColor: typeColors[type] }}
                          >
                            {type}
                          </Badge>
                        )) : 
                        'None'
                      }
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => openEditModal(pokemon)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removePokemonFromTeam(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </>
    );
  };

  const renderTeamAnalysis = () => {
    if (selectedPokemons.length === 0) {
      return null;
    }

    const analysis = calculateTeamWeaknesses();

    return (
      <div className="mt-4 mb-4">
        <h3>Team Analysis</h3>
        <Card>
          <Card.Body>
            <div className="mb-3">
              <h5>Team Weaknesses</h5>
              {analysis.weaknesses.length > 0 ? (
                <div>
                  {analysis.weaknesses.map(type => (
                    <Badge 
                      key={type} 
                      className="me-2 mb-1 p-2"
                      style={{ backgroundColor: typeColors[type] }}
                    >
                      {type} ({analysis.weaknessCount[type]}/{selectedPokemons.length})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>No common weaknesses!</p>
              )}
            </div>
            
            <div className="mb-3">
              <h5>Team Resistances</h5>
              {analysis.resistances.length > 0 ? (
                <div>
                  {analysis.resistances.map(type => (
                    <Badge 
                      key={type} 
                      className="me-2 mb-1 p-2"
                      style={{ backgroundColor: typeColors[type] }}
                    >
                      {type} ({analysis.resistanceCount[type]}/{selectedPokemons.length})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>No common resistances.</p>
              )}
            </div>
            
            <div>
              <h5>Team Immunities</h5>
              {analysis.immunities.length > 0 ? (
                <div>
                  {analysis.immunities.map(type => (
                    <Badge 
                      key={type} 
                      className="me-2 mb-1 p-2"
                      style={{ backgroundColor: typeColors[type] }}
                    >
                      {type} ({analysis.immunityCount[type]}/{selectedPokemons.length})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>No immunities.</p>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderTeamSaveForm = () => {
    if (selectedPokemons.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 mb-5">
        <h3>Save Your Team</h3>
        <Card>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Team Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter a name for your team"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Team Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={teamDescription} 
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Describe your team strategy, goals, etc."
                />
              </Form.Group>
              
              <Button 
                variant="success" 
                onClick={saveTeamToFirebase}
                disabled={savingTeam || !teamName.trim()}
                className="w-100"
              >
                {savingTeam ? 'Saving...' : 'Save Team to Hall of Fame'}
              </Button>
              
              {saveError && (
                <div className="text-danger mt-2">
                  {saveError}
                </div>
              )}
              
              {saveSuccess && (
                <div className="text-success mt-2">
                  Team saved successfully!
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Build Your Pokémon Team</h1>
      
      <Row className="mb-4">
        <Col xs={12} md={6} lg={4}>
          <Form.Group controlId="formGameSelect">
            <Form.Label>Select Game</Form.Label>
            <Form.Control as="select" value={selectedGame} onChange={handleGameChange}>
              {Object.keys(games).map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>

        <Col xs={12} md={6} lg={4}>
          <Form.Group controlId="formDexTypeSelect">
            <Form.Label>Select Dex Type</Form.Label>
            <Form.Control as="select" value={dexType} onChange={handleDexTypeChange}>
              <option value="regional">Regional Dex</option>
              <option value="national">National Dex</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      <Button 
        variant="primary" 
        onClick={handleFetchData} 
        className="w-100 mb-4" 
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Fetch Pokémon Data'}
      </Button>

      {/* Selected Team Display */}
      {renderSelectedTeam()}
      
      {/* Team Analysis */}
      {renderTeamAnalysis()}
      
      {/* Team Save Form */}
      {renderTeamSaveForm()}
      
      {/* Pokémon List */}
      <h3 className="mt-5 mb-3">Available Pokémon</h3>
      <Row>
        {renderPokemonList()}
      </Row>

      {/* Add Pokémon Modal */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Pokémon Added</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addedPokemon && <p>{addedPokemon.name} has been added to your team!</p>}
        </Modal.Body>
      </Modal>
      
      {/* Edit Pokémon Modal */}
      <Modal show={editModalVisible} onHide={() => setEditModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit {editingPokemon?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingPokemon && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nickname</Form.Label>
                <Form.Control 
                  type="text" 
                  value={pokemonNicknames[editingPokemon.name] || ''} 
                  onChange={handleNicknameChange}
                  placeholder="Give your Pokémon a nickname"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={pokemonNotes[editingPokemon.name] || ''} 
                  onChange={handleNotesChange}
                  placeholder="Add notes about moves, EVs, strategy, etc."
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditModalVisible(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setEditModalVisible(false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Button variant="danger" onClick={handleLogout} className="w-100 mt-5">
        Logout
      </Button>
    </Container>
  );
}
