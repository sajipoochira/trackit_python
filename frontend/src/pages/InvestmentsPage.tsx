import { useEffect, useState } from 'react';
import { fetchInvestments, createInvestment, deleteInvestment } from '../api/investments';
import { Investment } from '../types';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    current_value: '',
    purchase_value: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInvestments();
      setInvestments(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const data = {
        name: formData.name,
        type: formData.type,
        current_value: parseFloat(formData.current_value),
        purchase_value: parseFloat(formData.purchase_value),
      };

      await createInvestment(data);
      setFormData({ name: '', type: '', current_value: '', purchase_value: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create investment');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInvestment(id);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete investment');
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Investments</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Investment'}
      </button>

      {showForm && (
        <div style={{ margin: '1rem 0' }}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Type"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
          />
          <input
            type="number"
            placeholder="Current Value"
            value={formData.current_value}
            onChange={e => setFormData({ ...formData, current_value: e.target.value })}
          />
          <input
            type="number"
            placeholder="Purchase Value"
            value={formData.purchase_value}
            onChange={e => setFormData({ ...formData, purchase_value: e.target.value })}
          />
          <button onClick={handleAdd}>Save</button>
        </div>
      )}

      <ul>
        {investments.map((investment) => (
          <li key={investment.id}>
            {investment.name} (${investment.current_value.toFixed(2)})
            <button onClick={() => handleDelete(investment.id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvestmentsPage;
