const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 10000 });

let rooms = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (!rooms[data.room]) {
      rooms[data.room] = {
        players: [],
        scores: {},
        questions: [],
        index: 0
      };
    }

    const room = rooms[data.room];

    if (data.type === "join") {
      room.players.push(data.name);
      room.scores[data.name] = 0;

      broadcast(data.room, {
        type: "players",
        players: room.players
      });
    }

    if (data.type === "start") {
      room.questions = data.questions;
      room.index = 0;

      broadcast(data.room, {
        type: "start",
        questions: data.questions
      });
    }

    if (data.type === "answer") {
      room.scores[data.name] += data.points;

      const ranking = Object.entries(room.scores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);

      broadcast(data.room, {
        type: "ranking",
        ranking
      });
    }

    if (data.type === "timeUp") {
      broadcast(data.room, { type: "showRanking" });
    }

    if (data.type === "next") {
      room.index++;

      if (room.index >= room.questions.length) {
        broadcast(data.room, { type: "end" });
      } else {
        broadcast(data.room, {
          type: "next",
          index: room.index
        });
      }
    }
  });

  function broadcast(roomId, msg) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  }
});

console.log("Servidor rodando");
