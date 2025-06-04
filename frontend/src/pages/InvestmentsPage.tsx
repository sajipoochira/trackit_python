import { useEffect, useState } from 'react';
import { fetchInvestments, createInvestment, deleteInvestment } from '../api/investments';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const token = localStorage.getItem('access_token') || '';

  const load = async () => setInvestments(await fetchInvestments(token));

  const handleAdd = async () => {
    const name = prompt('Name?');
    const type = prompt('Type?');
    const current_value = parseFloat(prompt('Current value?') || '0');
    const purchase_value = parseFloat(prompt('Purchase value?') || '0');
    await createInvestment({ name, type, current_value, purchase_value }, token);
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteInvestment(id, token);
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>Investments</h2>
      <button onClick={handleAdd}>Add</button>
      <ul>
        {investments.map((i: any) => (
          <li key={i.id}>{i.name} ({i.current_value}) <button onClick={() => handleDelete(i.id)}>X</button></li>
        ))}
      </ul>
    </div>
  );
};

export default InvestmentsPage;
