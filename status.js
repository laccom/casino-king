module.exports = {
  setStatus(client) {
    try {
      // Met à jour le statut toutes les 10 secondes
      setInterval(() => {
        const serverCount = client.guilds.cache.size;
        client.user.setActivity(`🔥.gg/casinoking`, {
          type: 4 // "Joue à"
        });
      }, 10_000); // 10 000 ms = 10 secondes
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    }
  }
};
