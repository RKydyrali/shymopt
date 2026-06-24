import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from '@/components/layout/Layout';

// Pages
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import LotDetailPage from '@/pages/LotDetailPage';
import FarmersList from '@/pages/FarmersList';
import FarmerProfilePage from '@/pages/FarmerProfilePage';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Orders from '@/pages/Orders';
import OrderDetailPage from '@/pages/OrderDetailPage';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Farmer Dashboard Pages
import FarmerLayout from '@/components/layout/FarmerLayout';
import Dashboard from '@/pages/farmer/Dashboard';
import MyLots from '@/pages/farmer/MyLots';
import MyOrders from '@/pages/farmer/MyOrders';
import MyReviews from '@/pages/farmer/MyReviews';
import AiConsultant from '@/pages/farmer/AiConsultant';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:id" element={<LotDetailPage />} />
          <Route path="farmers" element={<FarmersList />} />
          <Route path="farmers/:id" element={<FarmerProfilePage />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          <Route path="farmer" element={<FarmerLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="lots" element={<MyLots />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="reviews" element={<MyReviews />} />
            <Route path="consultant" element={<AiConsultant />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
