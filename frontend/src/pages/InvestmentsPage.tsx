import { useEffect, useState } from 'react';
import { fetchInvestments, createInvestment, deleteInvestment } from '../api/investments';
import { Investment } from '../types';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('access_token') || '';

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInvestments(token);
      setInvestments(data);
    } catch (err) {
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const name = prompt('Name?');
      if (!name) return;
      
      const type = prompt('Type?');
      if (!type) return;
      
      const currentValue = prompt('Current value?');
      if (!currentValue) return;
      
      const purchaseValue = prompt('Purchase value?');
      if (!purchaseValue) return;

      const data = {
        name,
        type,
        current_value: parseFloat(currentValue),
        purchase_value: parseFloat(purchaseValue)
      };

      await createInvestment(data, token);
      load();
    } catch (err) {
      setError('Failed to create investment');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInvestment(id, token);
      load();
    } catch (err) {
      setError('Failed to delete investment');
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Investments</h2>
      <button onClick={handleAdd}>Add</button>
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