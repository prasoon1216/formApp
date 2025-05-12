const API_BASE_URL = 'http://localhost:5000/api';

export const productionApi = {
  // Get all production records
  getAllProductions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/production`);
      if (!response.ok) throw new Error('Failed to fetch productions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching productions:', error);
      throw error;
    }
  },

  // Create a new production record
  createProduction: async (productionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productionData),
      });
      if (!response.ok) throw new Error('Failed to create production');
      return await response.json();
    } catch (error) {
      console.error('Error creating production:', error);
      throw error;
    }
  },

  // Get a specific production record
  getProduction: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production/${id}`);
      if (!response.ok) throw new Error('Failed to fetch production');
      return await response.json();
    } catch (error) {
      console.error('Error fetching production:', error);
      throw error;
    }
  },

  // Update a production record
  updateProduction: async (id, productionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productionData),
      });
      if (!response.ok) throw new Error('Failed to update production');
      return await response.json();
    } catch (error) {
      console.error('Error updating production:', error);
      throw error;
    }
  },

  // Delete a production record
  deleteProduction: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/production/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete production');
      return await response.json();
    } catch (error) {
      console.error('Error deleting production:', error);
      throw error;
    }
  },
}; 