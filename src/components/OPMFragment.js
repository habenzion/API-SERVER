import React, { useState, useEffect } from 'react';
import './OPMFragment.css';

function OPMFragment() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch('https://api-server-nu.vercel.app/api/ads');
        const data = await response.json();
        setAds(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching ads: ' + err.message);
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  if (loading) return <div className="opm-loading">Loading...</div>;
  if (error) return <div className="opm-error">{error}</div>;

  return (
    <div className="opm-fragment">
      {ads.map((ad, index) => (
        <div key={index} className="opm-card">
          <img src={ad.imageUrl} alt={ad.title} className="opm-image" />
          <div className="opm-content">
            <h3 className="opm-title">{ad.title}</h3>
            <p className="opm-message">{ad.message}</p>
            <a 
              href={ad.actionLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="opm-button"
            >
              {ad.actionText}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OPMFragment; 