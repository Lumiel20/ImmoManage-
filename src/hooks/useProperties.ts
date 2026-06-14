import React, { useState, useMemo } from 'react';
import { Property } from '../types';
import { safeFetchJson } from './usePropertyApp';

interface UsePropertiesParams {
  token: string | null;
  addActionLog: (
    type: 'creation' | 'edition' | 'suppression',
    target: 'contrat' | 'bien' | 'locataire',
    title: string,
    description: string
  ) => void;
  setToastMsg: (msg: string | null) => void;
  setConfirmModal: (modal: any) => void;
}

export function useProperties({ token, addActionLog, setToastMsg, setConfirmModal }: UsePropertiesParams) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form Fields
  const [propertyTitle, setPropertyTitle] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');
  const [propertyType, setPropertyType] = useState('appartement');
  const [propertyPrice, setPropertyPrice] = useState(0);
  const [propertyCity, setPropertyCity] = useState('');
  const [propertySurface, setPropertySurface] = useState(45);
  const [propertyRooms, setPropertyRooms] = useState(2);
  const [propertyStatus, setPropertyStatus] = useState('disponible');

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');

  // Validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getPropertyErrors = () => {
    const errors: Record<string, string> = {};
    if (!propertyTitle || propertyTitle.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (propertyPrice <= 0) {
      errors.price = 'Price must be greater than 0.';
    }
    if (!propertyCity || propertyCity.trim().length < 2) {
      errors.city = 'City must be at least 2 characters.';
    }
    if (propertySurface <= 0) {
      errors.surface = 'Surface must be greater than 0.';
    }
    if (propertyRooms <= 0 || !Number.isInteger(propertyRooms)) {
      errors.rooms = 'Number of rooms must be an integer greater than 0.';
    }
    return errors;
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const json = await safeFetchJson('/api/v1/biens');
      if (json.success) setProperties(json.data);
    } catch (err: any) {
      if (err?.message !== 'Invalid token' && err?.message !== 'Unauthorized') {
        console.error("Error fetching properties:", err);
      }
    } finally {
      setLoadingProperties(false);
    }
  };

  const openNewProperty = () => {
    setTouched({});
    setAttemptedSubmit(false);
    setEditingProperty(null);
    setPropertyTitle('');
    setPropertyDescription('');
    setPropertyType('appartement');
    setPropertyPrice(150000);
    setPropertyCity('Paris');
    setPropertySurface(45);
    setPropertyRooms(2);
    setPropertyStatus('disponible');
    setIsPropertyModalOpen(true);
  };

  const openEditProperty = (prop: Property) => {
    setTouched({});
    setAttemptedSubmit(false);
    setEditingProperty(prop);
    setPropertyTitle(prop.titre);
    setPropertyDescription(prop.description || '');
    setPropertyType(prop.type || 'appartement');
    setPropertyPrice(prop.prix || 0);
    setPropertyCity(prop.ville || '');
    setPropertySurface(prop.surface || 45);
    setPropertyRooms(prop.nb_pieces || 2);
    setPropertyStatus(prop.statut || 'disponible');
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setAttemptedSubmit(true);
    const errors = getPropertyErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      titre: propertyTitle,
      description: propertyDescription,
      type: propertyType,
      prix: Number(propertyPrice),
      ville: propertyCity,
      surface: Number(propertySurface),
      nb_pieces: Number(propertyRooms),
      statut: propertyStatus
    };

    try {
      const url = editingProperty ? `/api/v1/biens/${editingProperty.id}` : '/api/v1/biens';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        addActionLog(
          editingProperty ? 'edition' : 'creation',
          'bien',
          editingProperty ? 'Property updated' : 'Property added',
          editingProperty ? `Modifications applied to "${propertyTitle}".` : `Property "${propertyTitle}" created in ${propertyCity}.`
        );
        setIsPropertyModalOpen(false);
        fetchProperties();
      } else {
        alert(json.error?.message || "An error occurred during save.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const handleDeleteProperty = (id: number) => {
    if (!token) return;
    const targetProp = properties.find(b => b.id === id);
    if (!targetProp) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete property",
      message: `Are you sure you want to delete the property "${targetProp.titre}"? This will also delete any related leases and documents.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/biens/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            addActionLog('suppression', 'bien', 'Property deleted', `The property "${targetProp.titre}" in ${targetProp.ville} was removed.`);
            setToastMsg(`Property "${targetProp.titre}" deleted successfully!`);
            fetchProperties();
          } else {
            setToastMsg(json.error?.message || "An error occurred.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Connection error.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      const matchesSearch = 
        prop.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        prop.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prop.description && prop.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === 'Tous' || prop.type?.toLowerCase() === filterType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [properties, searchTerm, filterType]);

  const propertyErrors = getPropertyErrors();

  return {
    properties, setProperties,
    loadingProperties, setLoadingProperties,
    isPropertyModalOpen, setIsPropertyModalOpen,
    editingProperty, setEditingProperty,
    
    // Form fields
    propertyTitle, setPropertyTitle,
    propertyDescription, setPropertyDescription,
    propertyType, setPropertyType,
    propertyPrice, setPropertyPrice,
    propertyCity, setPropertyCity,
    propertySurface, setPropertySurface,
    propertyRooms, setPropertyRooms,
    propertyStatus, setPropertyStatus,
    
    // Filters
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    filteredProperties,
    
    // Validation
    propertyErrors,
    propertyTouched: touched,
    propertyAttemptedSubmit: attemptedSubmit,
    markPropertyTouched: markTouched,
    
    // Methods
    fetchProperties,
    openNewProperty,
    openEditProperty,
    handleSaveProperty,
    handleDeleteProperty
  };
}
