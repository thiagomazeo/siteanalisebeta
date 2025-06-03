import React, { useEffect, useState } from 'react'
import { Card, CardContent } from './components/Card.jsx'

const pesos = {
  posse: 0.2,
  pressao: 0.2,
  chutes: 0.2,
  segundaBola: 0.15,
  marcacao: 0.15,
  saida: 0.1,
};

function extrairStats(statsRaw) {
  if (!statsRaw || !Array.isArray(statsRaw)) return null;

  const statsMap = {
    posse: { home: 0, away: 0 },
    pressao: { home: 0, away: 0 },
    chutes: { home: 0, away: 0 },
    segundaBola: { home: 0, away: 0 },
    marcacao: { home: 0, away: 0 },
    saida: { home: 0, away: 0 },
  };

  for (const stat of statsRaw) {
    switch (stat.name) {
      case 'Ball Possession':
        statsMap.posse.home = stat.home ?? 0;
        statsMap.posse.away = stat.away ?? 0;
        break;
      case 'Shots on Goal':
        statsMap.chutes.home = stat.home ?? 0;
        statsMap.chutes.away = stat.away ?? 0;
        break;
      case 'Pressure':
        statsMap.pressao.home = stat.home ?? 0;
        statsMap.pressao.away = stat.away ?? 0;
        break;
      // Outros critérios podem ser adicionados quando disponíveis
      default:
        break;
    }
  }

  return statsMap;
}

function calcularNota(stats) {
  if (!stats) return [0, 0];

  const notaA =
    (stats.posse?.home || 0) * pesos.posse +
    (stats.pressao?.home || 0) * pesos.pressao +
    (stats.chutes?.home || 0) * pesos.chutes +
    (stats.segundaBola?.home || 0) * pesos.segundaBola +
    (stats.marcacao?.home || 0) * pesos.marcacao +
    (stats.saida?.home || 0) * pesos.saida;

  const notaB =
    (stats.posse?.away || 0) * pesos.posse +
    (stats.pressao?.away || 0) * pesos.pressao +
    (stats.chutes?.away || 0) * pesos.chutes +
    (stats.segundaBola?.away || 0) * pesos.segundaBola +
    (stats.marcacao?.away || 0) * pesos.marcacao +
    (stats.saida?.away || 0) * pesos.saida;

  return [notaA, notaB];
}

export default function App() {
  const [jogos, setJogos] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDados() {
      try {
        const res = await fetch('https://sofascore.p.rapidapi.com/sport/football/events/live', {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'sofascore.p.rapidapi.com',
            'x-rapidapi-key': 'b8161c7f05msh41c6944585a0769p18cb3ejsncd42beac4c7a',
          },
        });

        const data = await res.json();
        const eventos = data.events || [];

        const jogosComStats = await Promise.all(
          eventos.map(async (jogo) => {
            try {
              const statsRes = await fetch(
                `https://sofascore.p.rapidapi.com/sport/football/event/${jogo.id}/statistics`,
                {
                  method: 'GET',
                  headers: {
                    'x-rapidapi-host': 'sofascore.p.rapidapi.com',
                    'x-rapidapi-key': 'b8161c7f05msh41c6944585a0769p18cb3ejsncd42beac4c7a',
                  },
                }
              );
              const statsData = await statsRes.json();
              const stats = extrairStats(statsData.statistics);
              return { ...jogo, stats };
            } catch {
              return { ...jogo, stats: null };
            }
          })
        );

        setJogos(jogosComStats);
      } catch (error) {
        setErro('Erro ao carregar jogos ao vivo com análise.');
      } finally {
        setLoading(false);
      }
    }

    fetchDados();

    // Atualiza a cada 10 minutos
    const interval = setInterval(fetchDados, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: 'auto', padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Jogos Ao Vivo - Análise Back Favorito</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {loading && <p>Carregando jogos e análise...</p>}

      {!loading && jogos.length === 0 && <p>Nenhum jogo ao vivo no momento.</p>}

      {jogos.map((jogo) => {
        const [notaA, notaB] = calcularNota(jogo.stats);
        const favorito = notaA > notaB ? jogo.homeTeam.name : jogo.awayTeam.name;
        const prob = Math.round((Math.max(notaA, notaB) / 10) * 100);

        return (
          <Card key={jogo.id} style={{ marginBottom: 16 }}>
            <CardContent>
              <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
                {jogo.homeTeam.name} vs {jogo.awayTeam.name}
              </div>
              <div>Placar: {jogo.homeScore.current} x {jogo.awayScore.current}</div>
              <div>Tempo: {jogo.time?.minute || 0}' {jogo.status?.description || ''}</div>
              <div>Probabilidade de acerto: <strong>{prob}%</strong></div>
              <div>Recomendação: <span style={{ fontWeight: 'bold', color: '#16a34a' }}>Back {favorito}</span></div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}