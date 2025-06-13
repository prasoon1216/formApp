import React, { useState, useEffect } from "react";
import axios from 'axios'; 
import { v4 as uuidv4 } from 'uuid'; 

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [formData, setFormData] = useState({
    type: "CNC",
    name: "",
    targetOEE: "",
  });
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({}); 

  const fetchMachines = async () => {
    try {
      const response = await axios.get('/machines');
      const sortedMachines = response.data.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type.localeCompare(b.type);
      });
      setMachines(sortedMachines);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  // Fetch machines from the backend when the component loads
  useEffect(() => {
    fetchMachines();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error message when user types
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Machine name is required.";
    if (!formData.targetOEE.trim()) newErrors.targetOEE = "Target OEE is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Normalize type and name to lowercase for case-insensitive comparison
      const normalizedType = formData.type.toLowerCase();
      const normalizedName = formData.name.toLowerCase();

      // Check for duplicate machine
      const isDuplicate = machines.some(
        (machine) =>
          machine.type.toLowerCase() === normalizedType &&
          machine.name.toLowerCase() === normalizedName
      );

      if (isDuplicate) {
        alert('A machine with the same type and name already exists.');
        return;
      }

      const newMachine = { id: uuidv4(), ...formData }; 

      // Send the new machine to the backend
      await axios.post('/machines', newMachine);

      // Fetch the updated list of machines
      await fetchMachines();

      // Reset form data but retain the current type
      setFormData({ ...formData, name: "", targetOEE: "" });
      setErrors({});
    } catch (error) {
      console.error('Error adding machine:', error.response || error.message);
      alert('Failed to add machine. Please try again.');
    }
  };

  const handleEditMachine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const machineToEdit = machines[selectedMachine.index];
      console.log('🛠️ Editing machine:', machineToEdit);

      // Use the correct `_id` for the PUT request
      const machineId = machineToEdit._id;
      console.log('🆔 Using ID for PUT request:', machineId);

      if (!machineId) {
        console.error('❌ Machine ID is missing in selected machine');
        alert('Failed to edit machine. Machine ID is missing.');
        return; 
      }

      const updateUrl = `/machines/${machineId}`;
      console.log('🔗 PUT URL:', updateUrl);

      // Remove the `id` and `_id` fields from the request body
      const { id, _id, ...cleanFormData } = formData;
      console.log('📦 Sending update with data:', cleanFormData);

      const response = await axios.put(updateUrl, cleanFormData);

      if (response.status !== 200) {
        console.error('❌ Error while editing machine: Unexpected response status', response.status);
        alert('Failed to edit machine. Unexpected response from the server.');
        return; // Stop further execution
      }

      console.log('✅ Machine updated successfully:', response.data);

      // Fetch the updated list of machines
      await fetchMachines();

      setIsEditing(false);
      setSelectedMachine(null);
      setFormData({ type: "CNC", name: "", targetOEE: "" });
      setErrors({});
    } catch (error) {
      if (error.response) {
        console.error('❌ Error while editing machine:', error.response.status);
        console.error('Response data:', error.response.data);
        alert(`Failed to edit machine. Server responded with status: ${error.response.status}`);
      } else {
        console.error('❌ Error while editing machine:', error.message);
        alert('Failed to edit machine. Please try again.');
      }
      return; 
    }
  };

  const handleDeleteMachine = async () => {
    if (!selectedMachine) return;

    if (window.confirm("Are you sure you want to delete this machine?")) {
      try {
        const machineToDelete = machines[selectedMachine.index];
        console.log('Deleting machine:', machineToDelete);

        if (!machineToDelete._id) {
          console.error('Machine ID is undefined:', machineToDelete);
          alert('Failed to delete machine. Machine ID is missing.');
          return;
        }

        // Send delete request to the backend
        await axios.delete(`/machines/${machineToDelete._id}`);

        // Fetch the updated list of machines
        await fetchMachines();

        setSelectedMachine(null);
        setFormData({ type: "CNC", name: "", targetOEE: "" });
        setIsEditing(false);
      } catch (error) {
        console.error('Error deleting machine:', error.response || error.message);
        alert('Failed to delete machine. Please try again.');
      }
    }
  };

  const handleSelectMachine = (type, index) => {
    if (
      selectedMachine?.type === type &&
      selectedMachine?.index === index
    ) {
      setSelectedMachine(null);
      setIsEditing(false);
      setFormData({ type: "CNC", name: "", targetOEE: "" });
    } else {
      setSelectedMachine({ type, index });
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    if (selectedMachine) {
      const machineToEdit = machines[selectedMachine.index];
      setFormData({ ...machineToEdit }); 
      setIsEditing(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[120vh] bg-gradient-to-br from-gray-200 to-gray-100">
      <div className="bg-white/80 backdrop-blur-md shadow-lg p-8 rounded-lg max-w-6xl w-full text-center min-h-[800px]">
        <h1 className="text-4xl font-bold mb-6">Machines</h1>

        <div className="grid grid-cols-3 gap-6">
          {/* Existing Machines Section */}
          <div className="col-span-2 bg-gray-100 p-6 rounded-lg shadow-lg min-h-[350px]">
            <h2 className="text-lg font-bold text-center mb-4">Existing Machines</h2>
            <div className="grid grid-cols-2 gap-4">
              {["CNC", "VMC"].map((machineType, typeIndex) => (
                <div key={machineType} className="flex flex-col grid-cols-2">
                  <h3 className="text-center font-bold pb-2">{machineType}</h3>
                  <div className="flex flex-wrap gap-2 min-h-[150px] border border-gray-300 p-3 rounded-lg">
                    {machines
                      .map((machine, index) => ({ ...machine, index }))
                      .filter((machine) => machine.type === machineType)
                      .map(({ name, targetOEE, index }) => (
                        <div
                          key={index}
                          onClick={() => handleSelectMachine(machineType, index)}
                          className={`px-4 py-2 rounded border cursor-pointer border-green-300 w-full text-center ${
                            selectedMachine?.type === machineType &&
                            selectedMachine?.index === index
                              ? "bg-gray-300"
                              : "bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{machineType}-{name}</span> 
                            <span className="text-lg text-gray-600">T-OEE {targetOEE}%</span> 
                          </div>
                        </div>
                      ))}
                  </div>
                  {typeIndex === 0 && <hr className="my-4 border-hidden" />}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleEditClick}
                className="bg-blue-500 text-white px-5 py-2 rounded-lg mx-2"
                disabled={!selectedMachine}
              >
                Edit
              </button>
              <button
                onClick={handleDeleteMachine}
                className="bg-red-500 text-white px-5 py-2 rounded-lg mx-2"
                disabled={!selectedMachine}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Add/Edit Machine Section */}
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg min-h-[350px]">
            <h2 className="text-lg font-bold text-center mb-4">
              {isEditing ? "Edit Machine" : "Add New Machine"}
            </h2>
            <form onSubmit={isEditing ? handleEditMachine : handleAddMachine}>
              <div className="mb-4">
                <label className="block font-bold mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="CNC">CNC</option>
                  <option value="VMC">VMC</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block font-bold mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter machine name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <label className="block font-bold mb-2">Target OEE</label>
                <input
                  type="number"
                  name="targetOEE"
                  value={formData.targetOEE}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded ${
                    errors.targetOEE ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter target OEE"
                />
                {errors.targetOEE && <p className="text-red-500 text-xs mt-1">{errors.targetOEE}</p>}
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-5 py-2 rounded-lg"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
                <button
                  type="reset"
                  className="bg-gray-500 text-white px-5 py-2 rounded-lg"
                  onClick={() => {
                    setFormData({ type: "CNC", name: "", targetOEE: "" });
                    setSelectedMachine(null);
                    setIsEditing(false);
                    setErrors({});
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
