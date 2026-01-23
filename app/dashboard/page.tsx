'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AvailableAPI, UserRole } from '@/types/auth';
import { getAvailableAPIs } from '@/lib/helpers/api-utils';

interface ApiRecord {
  id: string;
  userName: string;
  userInitials: string;
  userColor: string;
  endpoint: string;
  status: 'Active' | 'Maintenance' | 'Deprecated';
  dateCreated: string;
}

interface User {
  _id: string;
  email: string;
  role: 'superadmin' | 'admin';
  apis?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface Buffet {
  _id: string;
  nombre: string;
  lugar: string;
  descripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface Evento {
  _id: string;
  buffet_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  capacidad: number;
  estado: 'planificado' | 'en_curso' | 'finalizado' | 'cancelado';
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface Producto {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface Promo {
  _id: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  productos: string[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface Orden {
  _id: string;
  buffet_id: string;
  evento_id?: string;
  productos: Array<{
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  total: number;
  estado: 'pendiente' | 'confirmada' | 'en_preparacion' | 'lista' | 'entregada' | 'cancelada';
  forma_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  fechaCreacion: string;
  fechaActualizacion: string;
}

const mockApiRecords: ApiRecord[] = [
  {
    id: 'USR-84920',
    userName: 'Johnathan Doe',
    userInitials: 'JD',
    userColor: 'blue',
    endpoint: '/api/v1/users/fetch',
    status: 'Active',
    dateCreated: 'Oct 24, 2023'
  },
  {
    id: 'USR-84921',
    userName: 'Jane Smith',
    userInitials: 'JS',
    userColor: 'purple',
    endpoint: '/api/v1/users/fetch',
    status: 'Active',
    dateCreated: 'Oct 25, 2023'
  },
  {
    id: 'USR-84925',
    userName: 'System Bot',
    userInitials: 'SB',
    userColor: 'amber',
    endpoint: '/api/v1/users/fetch',
    status: 'Maintenance',
    dateCreated: 'Oct 26, 2023'
  },
  {
    id: 'USR-84930',
    userName: 'Legacy App',
    userInitials: 'LA',
    userColor: 'rose',
    endpoint: '/api/v1/users/fetch',
    status: 'Deprecated',
    dateCreated: 'Oct 27, 2023'
  },
  {
    id: 'USR-84942',
    userName: 'Web Portal',
    userInitials: 'WP',
    userColor: 'indigo',
    endpoint: '/api/v1/users/fetch',
    status: 'Active',
    dateCreated: 'Oct 28, 2023'
  }
];

const sidebarFeatures = [
  {
    name: 'User Management',
    apis: [
      { name: 'Get Users', endpoint: '/api/v1/users/fetch', active: true },
      { name: 'Create User', endpoint: '/api/v1/users/create', active: false },
      { name: 'Update Profile', endpoint: '/api/v1/users/update', active: false }
    ]
  },
  {
    name: 'Admin Buffets',
    apis: [
      { name: 'Buffets', endpoint: '/api/admin-buffets/buffets', active: false },
      { name: 'Eventos', endpoint: '/api/admin-buffets/eventos', active: false },
      { name: 'Productos', endpoint: '/api/admin-buffets/productos', active: false },
      { name: 'Promos', endpoint: '/api/admin-buffets/promos', active: false },
      { name: 'Ordenes', endpoint: '/api/admin-buffets/ordenes', active: false }
    ]
  }
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedApi, setSelectedApi] = useState('Get Users');
  const [apiRecords] = useState<ApiRecord[]>(mockApiRecords);
  const [users, setUsers] = useState<User[]>([]);
  const [buffets, setBuffets] = useState<Buffet[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set()); // All collapsed by default
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    role: UserRole.ADMIN,
    api_access: [] as AvailableAPI[]
  });
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');

  // Modal states for buffet
  const [showCreateBuffetModal, setShowCreateBuffetModal] = useState(false);
  const [isCreatingBuffet, setIsCreatingBuffet] = useState(false);
  const [createBuffetForm, setCreateBuffetForm] = useState({
    nombre: '',
    lugar: '',
    descripcion: '',
    user_id: ''
  });
  const [createBuffetError, setCreateBuffetError] = useState('');
  const [createBuffetSuccess, setCreateBuffetSuccess] = useState('');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Edit and Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch data when component mounts and specific API is selected
  useEffect(() => {
    if (session) {
      switch (selectedApi) {
        case 'Get Users':
          fetchUsers();
          break;
        case 'Buffets':
          fetchBuffets();
          break;
        case 'Eventos':
          fetchEventos();
          break;
        case 'Productos':
          fetchProductos();
          break;
        case 'Promos':
          fetchPromos();
          break;
        case 'Ordenes':
          fetchOrdenes();
          break;
      }
    }
  }, [selectedApi, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const toggleFeature = (featureIndex: number) => {
    const newExpandedFeatures = new Set(expandedFeatures);
    if (newExpandedFeatures.has(featureIndex)) {
      newExpandedFeatures.delete(featureIndex);
    } else {
      newExpandedFeatures.add(featureIndex);
    }
    setExpandedFeatures(newExpandedFeatures);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Error fetching users:', response.statusText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuffets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-buffets/buffets');
      if (response.ok) {
        const data = await response.json();
        setBuffets(data.buffets || []);
      } else {
        console.error('Error fetching buffets:', response.statusText);
        setBuffets([]);
      }
    } catch (error) {
      console.error('Error fetching buffets:', error);
      setBuffets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-buffets/eventos');
      if (response.ok) {
        const data = await response.json();
        setEventos(data.eventos || []);
      } else {
        console.error('Error fetching eventos:', response.statusText);
        setEventos([]);
      }
    } catch (error) {
      console.error('Error fetching eventos:', error);
      setEventos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-buffets/productos');
      if (response.ok) {
        const data = await response.json();
        setProductos(data.productos || []);
      } else {
        console.error('Error fetching productos:', response.statusText);
        setProductos([]);
      }
    } catch (error) {
      console.error('Error fetching productos:', error);
      setProductos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-buffets/promos');
      if (response.ok) {
        const data = await response.json();
        setPromos(data.promos || []);
      } else {
        console.error('Error fetching promos:', response.statusText);
        setPromos([]);
      }
    } catch (error) {
      console.error('Error fetching promos:', error);
      setPromos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrdenes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-buffets/ordenes');
      if (response.ok) {
        const data = await response.json();
        setOrdenes(data.ordenes || []);
      } else {
        console.error('Error fetching ordenes:', response.statusText);
        setOrdenes([]);
      }
    } catch (error) {
      console.error('Error fetching ordenes:', error);
      setOrdenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiSelect = (apiName: string) => {
    setSelectedApi(apiName);
    switch (apiName) {
      case 'Get Users':
        fetchUsers();
        break;
      case 'Buffets':
        fetchBuffets();
        break;
      case 'Eventos':
        fetchEventos();
        break;
      case 'Productos':
        fetchProductos();
        break;
      case 'Promos':
        fetchPromos();
        break;
      case 'Ordenes':
        fetchOrdenes();
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500"></span>
            Maintenance
          </span>
        );
      case 'Deprecated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <span className="size-1.5 rounded-full bg-slate-400"></span>
            Deprecated
          </span>
        );
      default:
        return null;
    }
  };

  const getUserBadge = (initials: string, color: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
      amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
    };

    return (
      <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${colorClasses[color as keyof typeof colorClasses]}`}>
        {initials}
      </div>
    );
  };

  const getInitialsFromEmail = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getColorFromRole = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'rose';
      case 'admin':
        return 'blue';
      default:
        return 'indigo';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const getApiDescription = (apiName: string) => {
    switch (apiName) {
      case 'Get Users':
        return 'Manage and view all users in the system.';
      case 'Buffets':
        return 'Manage and view all buffets in the system.';
      case 'Eventos':
        return 'Manage and view all events associated with buffets.';
      case 'Productos':
        return 'Manage and view all products available for buffets.';
      case 'Promos':
        return 'Manage and view all promotional offers and discounts.';
      case 'Ordenes':
        return 'Manage and view all orders placed for buffets and events.';
      default:
        return 'Manage and view all retrieval records for the selected endpoint.';
    }
  };

  const getCurrentData = () => {
    switch (selectedApi) {
      case 'Get Users':
        return users;
      case 'Buffets':
        return buffets;
      case 'Eventos':
        return eventos;
      case 'Productos':
        return productos;
      case 'Promos':
        return promos;
      case 'Ordenes':
        return ordenes;
      default:
        return [];
    }
  };

  const getDataCount = () => {
    return getCurrentData().length;
  };

  const renderTableHeaders = () => {
    switch (selectedApi) {
      case 'Get Users':
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">User ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">APIs Access</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created At</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
      case 'Buffets':
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lugar</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Descripción</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fecha Creación</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
      case 'Eventos':
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Buffet</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fecha Inicio</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
      case 'Productos':
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Categoría</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Precio</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Disponible</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
      case 'Promos':
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Descuento</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fecha Inicio</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
      case 'Ordenes':
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Buffet</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Forma Pago</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
      default:
        return (
          <>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Record ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">User Name</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Endpoint</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Created</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
          </>
        );
    }
  };

  const getEstadoBadge = (estado: string, tipo: 'evento' | 'orden' | 'promo') => {
    let colorClasses = '';
    let bgColorClasses = '';
    
    switch (tipo) {
      case 'evento':
        switch (estado) {
          case 'planificado':
            colorClasses = 'text-blue-700 dark:text-blue-400';
            bgColorClasses = 'bg-blue-100 dark:bg-blue-950/40';
            break;
          case 'en_curso':
            colorClasses = 'text-green-700 dark:text-green-400';
            bgColorClasses = 'bg-green-100 dark:bg-green-950/40';
            break;
          case 'finalizado':
            colorClasses = 'text-gray-700 dark:text-gray-400';
            bgColorClasses = 'bg-gray-100 dark:bg-gray-950/40';
            break;
          case 'cancelado':
            colorClasses = 'text-red-700 dark:text-red-400';
            bgColorClasses = 'bg-red-100 dark:bg-red-950/40';
            break;
        }
        break;
      case 'orden':
        switch (estado) {
          case 'pendiente':
            colorClasses = 'text-yellow-700 dark:text-yellow-400';
            bgColorClasses = 'bg-yellow-100 dark:bg-yellow-950/40';
            break;
          case 'confirmada':
            colorClasses = 'text-blue-700 dark:text-blue-400';
            bgColorClasses = 'bg-blue-100 dark:bg-blue-950/40';
            break;
          case 'en_preparacion':
            colorClasses = 'text-purple-700 dark:text-purple-400';
            bgColorClasses = 'bg-purple-100 dark:bg-purple-950/40';
            break;
          case 'lista':
            colorClasses = 'text-green-700 dark:text-green-400';
            bgColorClasses = 'bg-green-100 dark:bg-green-950/40';
            break;
          case 'entregada':
            colorClasses = 'text-emerald-700 dark:text-emerald-400';
            bgColorClasses = 'bg-emerald-100 dark:bg-emerald-950/40';
            break;
          case 'cancelada':
            colorClasses = 'text-red-700 dark:text-red-400';
            bgColorClasses = 'bg-red-100 dark:bg-red-950/40';
            break;
        }
        break;
      case 'promo':
        if (estado === 'true' || estado === 'activa') {
          colorClasses = 'text-green-700 dark:text-green-400';
          bgColorClasses = 'bg-green-100 dark:bg-green-950/40';
        } else {
          colorClasses = 'text-red-700 dark:text-red-400';
          bgColorClasses = 'bg-red-100 dark:bg-red-950/40';
        }
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColorClasses} ${colorClasses}`}>
        <span className={`size-1.5 rounded-full ${colorClasses.includes('blue') ? 'bg-blue-500' : 
          colorClasses.includes('green') ? 'bg-green-500' :
          colorClasses.includes('yellow') ? 'bg-yellow-500' :
          colorClasses.includes('purple') ? 'bg-purple-500' :
          colorClasses.includes('emerald') ? 'bg-emerald-500' :
          colorClasses.includes('red') ? 'bg-red-500' : 'bg-gray-500'}`}></span>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const renderTableRows = () => {
    const currentData = getCurrentData();
    
    if (currentData.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            No hay registros disponibles
          </td>
        </tr>
      );
    }

    switch (selectedApi) {
      case 'Get Users':
        return users.map((user) => (
          <tr key={user._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{user._id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {getUserBadge(getInitialsFromEmail(user.email), getColorFromRole(user.role))}
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.email}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'superadmin' 
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
              }`}>
                <span className={`size-1.5 rounded-full ${
                  user.role === 'superadmin' ? 'bg-rose-500' : 'bg-blue-500'
                }`}></span>
                {user.role}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.apis || 'Unlimited'}</td>
            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(user.createdAt)}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(user)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteModal(user)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));

      case 'Buffets':
        return buffets.map((buffet) => (
          <tr key={buffet._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{buffet._id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{buffet.nombre}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{buffet.lugar}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{buffet.descripcion.substring(0, 50)}...</td>
            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(buffet.fechaCreacion)}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(buffet)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteModal(buffet)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));

      case 'Eventos':
        return eventos.map((evento) => (
          <tr key={evento._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{evento._id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{evento.nombre}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{evento.buffet_id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4">{getEstadoBadge(evento.estado, 'evento')}</td>
            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(evento.fecha_inicio)}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(evento)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteModal(evento)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));

      case 'Productos':
        return productos.map((producto) => (
          <tr key={producto._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{producto._id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{producto.nombre}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{producto.categoria}</td>
            <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-slate-100">${producto.precio.toFixed(2)}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                producto.disponible 
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              }`}>
                <span className={`size-1.5 rounded-full ${
                  producto.disponible ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {producto.disponible ? 'Disponible' : 'No disponible'}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(producto)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteModal(producto)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));

      case 'Promos':
        return promos.map((promo) => (
          <tr key={promo._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{promo._id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{promo.nombre}</td>
            <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-slate-100">{promo.descuento}%</td>
            <td className="px-6 py-4">{getEstadoBadge(promo.activa ? 'activa' : 'inactiva', 'promo')}</td>
            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(promo.fecha_inicio)}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(promo)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteModal(promo)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));

      case 'Ordenes':
        return ordenes.map((orden) => (
          <tr key={orden._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{orden._id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{orden.buffet_id.slice(-8).toUpperCase()}</td>
            <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-slate-100">${orden.total.toFixed(2)}</td>
            <td className="px-6 py-4">{getEstadoBadge(orden.estado, 'orden')}</td>
            <td className="px-6 py-4">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">
                {orden.forma_pago}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(orden)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => openDeleteModal(orden)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));

      default:
        return apiRecords.map((record) => (
          <tr key={record.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{record.id}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {getUserBadge(record.userInitials, record.userColor)}
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{record.userName}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-mono">{record.endpoint}</span>
            </td>
            <td className="px-6 py-4">
              {getStatusBadge(record.status)}
            </td>
            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{record.dateCreated}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ));
    }
  };

  const getPaginationText = () => {
    const count = getDataCount();
    switch (selectedApi) {
      case 'Get Users':
        return count === 0 ? 'No users found' : `Showing ${count} users`;
      case 'Buffets':
        return count === 0 ? 'No buffets found' : `Showing ${count} buffets`;
      case 'Eventos':
        return count === 0 ? 'No events found' : `Showing ${count} events`;
      case 'Productos':
        return count === 0 ? 'No products found' : `Showing ${count} products`;
      case 'Promos':
        return count === 0 ? 'No promos found' : `Showing ${count} promos`;
      case 'Ordenes':
        return count === 0 ? 'No orders found' : `Showing ${count} orders`;
      default:
        return count === 0 ? 'No records found' : `Showing ${count} records`;
    }
  };

  const getAddButtonText = () => {
    switch (selectedApi) {
      case 'Get Users':
        return 'Add New User';
      case 'Buffets':
        return 'Add New Buffet';
      case 'Eventos':
        return 'Add New Event';
      case 'Productos':
        return 'Add New Product';
      case 'Promos':
        return 'Add New Promo';
      case 'Ordenes':
        return 'Add New Order';
      default:
        return 'Add New Record';
    }
  };

  const getApiEndpoint = () => {
    switch (selectedApi) {
      case 'Get Users':
        return 'GET /api/admin/users';
      case 'Buffets':
        return 'GET /api/admin-buffets/buffets';
      case 'Eventos':
        return 'GET /api/admin-buffets/eventos';
      case 'Productos':
        return 'GET /api/admin-buffets/productos';
      case 'Promos':
        return 'GET /api/admin-buffets/promos';
      case 'Ordenes':
        return 'GET /api/admin-buffets/ordenes';
      default:
        return 'GET /api/endpoint';
    }
  };

  // Funciones del modal de crear usuario
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setCreateUserError('');
    setCreateUserSuccess('');

    try {
      const payload: {
        email: string;
        password: string;
        role: UserRole;
        api_access?: AvailableAPI[];
      } = {
        email: createUserForm.email,
        password: createUserForm.password,
        role: createUserForm.role
      };

      // Solo agregar api_access si es admin y hay APIs seleccionadas
      if (createUserForm.role === UserRole.ADMIN && createUserForm.api_access.length > 0) {
        payload.api_access = createUserForm.api_access;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setCreateUserSuccess('Usuario creado exitosamente');
        setCreateUserForm({
          email: '',
          password: '',
          role: UserRole.ADMIN,
          api_access: []
        });
        // Refrescar la lista de usuarios si estamos en esa vista
        if (selectedApi === 'Get Users') {
          fetchUsers();
        }
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setShowCreateUserModal(false);
          setCreateUserSuccess('');
        }, 2000);
      } else {
        setCreateUserError(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setCreateUserError('Error interno del servidor');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleApiAccessChange = (api: AvailableAPI, checked: boolean) => {
    setCreateUserForm(prev => ({
      ...prev,
      api_access: checked 
        ? [...prev.api_access, api]
        : prev.api_access.filter(a => a !== api)
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    setCreateUserForm(prev => ({
      ...prev,
      role,
      // Limpiar api_access si cambia a superadmin
      api_access: role === UserRole.SUPERADMIN ? [] : prev.api_access
    }));
  };

  // Funciones del modal de crear buffet
  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        // Filtrar solo usuarios admin
        const admins = data.users?.filter((user: User) => user.role === 'admin') || [];
        setAdminUsers(admins);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleCreateBuffetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBuffet(true);
    setCreateBuffetError('');
    setCreateBuffetSuccess('');

    try {
      // Si es admin, usar su propio ID; si es superadmin, usar el seleccionado
      const buffetData = {
        ...createBuffetForm,
        user_id: session?.user?.role === 'admin' ? session.user.id : createBuffetForm.user_id
      };

      const response = await fetch('/api/admin-buffets/buffets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(buffetData)
      });

      const data = await response.json();

      if (response.ok) {
        setCreateBuffetSuccess('Buffet creado exitosamente');
        setCreateBuffetForm({ 
          nombre: '', 
          lugar: '', 
          descripcion: '', 
          user_id: session?.user?.role === 'admin' ? session.user.id : ''
        });
        
        // Refrescar la lista de buffets si estamos en esa vista
        if (selectedApi === 'Buffets') {
          fetchBuffets();
        }
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setShowCreateBuffetModal(false);
          setCreateBuffetSuccess('');
        }, 2000);
      } else {
        setCreateBuffetError(data.error || 'Error al crear buffet');
      }
    } catch (error) {
      console.error('Error creating buffet:', error);
      setCreateBuffetError('Error interno del servidor');
    } finally {
      setIsCreatingBuffet(false);
    }
  };

  // Delete handler for all resource types
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    setIsDeleting(true);
    setDeleteError('');

    try {
      let endpoint = '';
      const resourceId = selectedItem._id;

      switch (selectedApi) {
        case 'Get Users':
          endpoint = `/api/admin/users/${resourceId}`;
          break;
        case 'Buffets':
          endpoint = `/api/admin-buffets/buffets/${resourceId}`;
          break;
        case 'Eventos':
          endpoint = `/api/admin-buffets/eventos/${resourceId}`;
          break;
        case 'Productos':
          endpoint = `/api/admin-buffets/productos/${resourceId}`;
          break;
        case 'Promos':
          endpoint = `/api/admin-buffets/promos/${resourceId}`;
          break;
        case 'Ordenes':
          endpoint = `/api/admin-buffets/ordenes/${resourceId}`;
          break;
        default:
          throw new Error('Tipo de recurso no válido');
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh the appropriate list
        switch (selectedApi) {
          case 'Get Users':
            fetchUsers();
            break;
          case 'Buffets':
            fetchBuffets();
            break;
          case 'Eventos':
            fetchEventos();
            break;
          case 'Productos':
            fetchProductos();
            break;
          case 'Promos':
            fetchPromos();
            break;
          case 'Ordenes':
            fetchOrdenes();
            break;
        }
        setShowDeleteModal(false);
        setSelectedItem(null);
      } else {
        // Intentar leer la respuesta como JSON, pero manejar el caso de respuesta vacía
        let errorMessage = 'Error al eliminar el registro';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (jsonError) {
          // Si no se puede parsear el JSON, usar el status de la respuesta
          errorMessage = `Error ${response.status}: ${response.statusText || 'Error del servidor'}`;
        }
        setDeleteError(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setDeleteError('Error interno del servidor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit handler for all resource types
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsEditing(true);
    setEditError('');

    try {
      let endpoint = '';
      const resourceId = selectedItem._id;

      switch (selectedApi) {
        case 'Get Users':
          endpoint = `/api/admin/users/${resourceId}`;
          break;
        case 'Buffets':
          endpoint = `/api/admin-buffets/buffets/${resourceId}`;
          break;
        case 'Eventos':
          endpoint = `/api/admin-buffets/eventos/${resourceId}`;
          break;
        case 'Productos':
          endpoint = `/api/admin-buffets/productos/${resourceId}`;
          break;
        case 'Promos':
          endpoint = `/api/admin-buffets/promos/${resourceId}`;
          break;
        case 'Ordenes':
          endpoint = `/api/admin-buffets/ordenes/${resourceId}`;
          break;
        default:
          throw new Error('Tipo de recurso no válido');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        // Refresh the appropriate list
        switch (selectedApi) {
          case 'Get Users':
            fetchUsers();
            break;
          case 'Buffets':
            fetchBuffets();
            break;
          case 'Eventos':
            fetchEventos();
            break;
          case 'Productos':
            fetchProductos();
            break;
          case 'Promos':
            fetchPromos();
            break;
          case 'Ordenes':
            fetchOrdenes();
            break;
        }
        setShowEditModal(false);
        setSelectedItem(null);
        setEditForm({});
      } else {
        const data = await response.json();
        setEditError(data.error || 'Error al actualizar el registro');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setEditError('Error interno del servidor');
    } finally {
      setIsEditing(false);
    }
  };

  // Open edit modal and prepare edit form
  const openEditModal = (item: User | Buffet | Evento | Producto | Promo | Orden) => {
    setSelectedItem(item);
    setEditForm({ ...item });
    setShowEditModal(true);
    setEditError('');
  };

  // Open delete confirmation modal
  const openDeleteModal = (item: User | Buffet | Evento | Producto | Promo | Orden) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
    setDeleteError('');
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen overflow-y-auto">
        <div className="p-6 flex items-center gap-3">
          <div className="size-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,12H10V10H14M14,16H10V14H14M20,8H17.19C16.74,7.22 16.12,6.55 15.37,6.04L17,4.41L15.59,3L13.42,5.17C12.96,5.06 12.5,5 12,5C11.5,5 11.04,5.06 10.59,5.17L8.41,3L7,4.41L8.62,6.04C7.88,6.55 7.26,7.22 6.81,8H4V10H6.09C6.04,10.33 6,10.66 6,11V12H4V14H6V15C6,15.34 6.04,15.67 6.09,16H4V18H6.81C7.85,19.79 9.78,21 12,21C14.22,21 16.15,19.79 17.19,18H20V16H17.91C17.96,15.67 18,15.34 18,15V14H20V12H18V11C18,10.66 17.96,10.33 17.91,10H20V8M16,15A4,4 0 0,1 12,19A4,4 0 0,1 8,15V11A4,4 0 0,1 12,7A4,4 0 0,1 16,11V15Z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">API Admin</h1>
        </div>

        <nav className="flex-1 px-4 space-y-6">
          {sidebarFeatures.map((feature, featureIndex) => {
            const isExpanded = expandedFeatures.has(featureIndex);
            return (
            <div key={featureIndex}>
              <button
                onClick={() => toggleFeature(featureIndex)}
                className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <span>{feature.name}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
              </button>
              {isExpanded && (
              <div className="space-y-1">
                {feature.apis.map((api, apiIndex) => (
                  <button
                    key={apiIndex}
                    onClick={() => handleApiSelect(api.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      api.name === selectedApi
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                    </svg>
                    <span>{api.name}</span>
                  </button>
                ))}
              </div>
              )}
            </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
            <span>Settings</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium text-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19Z"/>
            </svg>
            <span>Log out</span>
          </button>
          <div className="mt-4 flex items-center gap-3 px-3 py-2">
            <div className="size-8 rounded-full bg-cover bg-center bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">Alex Rivera</span>
              <span className="text-xs text-slate-500 truncate">Admin Access</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Feature</span>
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
              </svg>
              <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">User Management</span>
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
              </svg>
              <span className="text-slate-900 dark:text-white">{selectedApi}</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
              <input 
                className="w-full pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500" 
                placeholder="Search logs or IDs..." 
                type="text"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10,21H14A2,2 0 0,1 12,23A2,2 0 0,1 10,21M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M17,11A5,5 0 0,0 12,6A5,5 0 0,0 7,11V18H17V11Z"/>
              </svg>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900/30">
          {/* Page Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedApi}</h2>
              <p className="text-slate-500 dark:text-slate-400">
                {getApiDescription(selectedApi)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (selectedApi === 'Get Users') {
                    setShowCreateUserModal(true);
                  } else if (selectedApi === 'Buffets') {
                    // Si es superadmin, cargar lista de usuarios admin
                    if (session?.user?.role === 'superadmin') {
                      fetchAdminUsers();
                    }
                    // Configurar user_id inicial
                    setCreateBuffetForm(prev => ({
                      ...prev,
                      user_id: session?.user?.role === 'admin' ? session.user.id : ''
                    }));
                    setShowCreateBuffetModal(true);
                  }
                  // Agregar más casos para otros tipos en el futuro
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                {getAddButtonText()}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-500">Loading...</span>
                </div>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    {renderTableHeaders()}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {renderTableRows()}
                </tbody>
              </table>
            </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {getPaginationText()}
              </span>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.41,16.58L10.83,12L15.41,7.42L14,6L8,12L14,18L15.41,16.58Z"/>
                  </svg>
                </button>
                <button className="px-2.5 py-1 text-xs font-bold rounded bg-blue-500 text-white">1</button>
                <button className="px-2.5 py-1 text-xs font-bold rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">2</button>
                <button className="px-2.5 py-1 text-xs font-bold rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">3</button>
                <button className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Documentation Snippet Footer */}
          <div className="mt-8 p-6 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">API Documentation</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Learn how to integrate the <code className="bg-blue-500/10 px-1 rounded text-blue-500">
                    {getApiEndpoint()}
                  </code> endpoint into your application.
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-blue-500/30 text-blue-500 text-sm font-bold rounded-lg hover:bg-blue-500/10 transition-colors">
              View Specs
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Crear Usuario */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crear Nuevo Usuario</h3>
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setCreateUserError('');
                    setCreateUserSuccess('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rol
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={UserRole.ADMIN}
                        checked={createUserForm.role === UserRole.ADMIN}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Admin</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Acceso limitado a APIs específicas</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={UserRole.SUPERADMIN}
                        checked={createUserForm.role === UserRole.SUPERADMIN}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Super Admin</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Acceso completo a todas las APIs</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* API Access - Solo para Admin */}
                {createUserForm.role === UserRole.ADMIN && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Acceso a APIs
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getAvailableAPIs().map((api) => (
                        <label key={api.value} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createUserForm.api_access.includes(api.value)}
                            onChange={(e) => handleApiAccessChange(api.value, e.target.checked)}
                            className="mt-0.5 text-blue-500 focus:ring-blue-500 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{api.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{api.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {createUserForm.api_access.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Los usuarios admin deben tener al menos una API asignada
                      </p>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {createUserError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                      </svg>
                      <span className="text-sm text-red-700 dark:text-red-400">{createUserError}</span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {createUserSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/>
                      </svg>
                      <span className="text-sm text-green-700 dark:text-green-400">{createUserSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUserModal(false);
                      setCreateUserError('');
                      setCreateUserSuccess('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingUser || (createUserForm.role === UserRole.ADMIN && createUserForm.api_access.length === 0)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isCreatingUser ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Usuario'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Buffet */}
      {showCreateBuffetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crear Nuevo Buffet</h3>
                <button
                  onClick={() => {
                    setShowCreateBuffetModal(false);
                    setCreateBuffetError('');
                    setCreateBuffetSuccess('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateBuffetSubmit} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Buffet
                  </label>
                  <input
                    type="text"
                    required
                    value={createBuffetForm.nombre}
                    onChange={(e) => setCreateBuffetForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    placeholder="Ej: Buffet Central"
                  />
                </div>

                {/* Usuario Propietario */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Usuario Propietario
                  </label>
                  {session?.user?.role === 'admin' ? (
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {session.user.email} (tú)
                    </div>
                  ) : (
                    <select
                      required
                      value={createBuffetForm.user_id}
                      onChange={(e) => setCreateBuffetForm(prev => ({ ...prev, user_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Seleccionar usuario admin...</option>
                      {adminUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {session?.user?.role === 'admin' 
                      ? 'Como admin, solo puedes crear buffets para ti mismo'
                      : 'Selecciona qué usuario admin será el propietario del buffet'
                    }
                  </p>
                </div>

                {/* Lugar */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lugar
                  </label>
                  <input
                    type="text"
                    required
                    value={createBuffetForm.lugar}
                    onChange={(e) => setCreateBuffetForm(prev => ({ ...prev, lugar: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    placeholder="Ej: Av. Principal 123, Ciudad"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={createBuffetForm.descripcion}
                    onChange={(e) => setCreateBuffetForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Describe el tipo de comida, especialidades, etc."
                  />
                </div>

                {/* Error Message */}
                {createBuffetError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                      </svg>
                      <span className="text-sm text-red-700 dark:text-red-400">{createBuffetError}</span>
                    </div>
                  </div>
                )}

                {/* Validation Warning */}
                {session?.user?.role === 'superadmin' && !createBuffetForm.user_id && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                      </svg>
                      <span className="text-sm text-amber-700 dark:text-amber-400">
                        ⚠️ Debes seleccionar un usuario admin como propietario del buffet
                      </span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {createBuffetSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/>
                      </svg>
                      <span className="text-sm text-green-700 dark:text-green-400">{createBuffetSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateBuffetModal(false);
                      setCreateBuffetError('');
                      setCreateBuffetSuccess('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isCreatingBuffet || 
                      (session?.user?.role === 'superadmin' && !createBuffetForm.user_id)
                    }
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isCreatingBuffet ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Buffet'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Editar {selectedApi === 'Get Users' ? 'Usuario' : selectedApi}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                    setEditForm({});
                    setEditError('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                {/* Renderizar campos según el tipo de recurso */}
                {selectedApi === 'Get Users' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rol
                      </label>
                      <select
                        value={editForm.role || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedApi === 'Buffets' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.nombre || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Lugar
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.lugar || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, lugar: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editForm.descripcion || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                  </>
                )}

                {selectedApi === 'Productos' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.nombre || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Precio
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm.precio || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, precio: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Categoría
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.categoria || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, categoria: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.disponible || false}
                          onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, disponible: e.target.checked }))}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Disponible
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {selectedApi === 'Eventos' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.nombre || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.descripcion || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Capacidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.capacidad || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, capacidad: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Estado
                      </label>
                      <select
                        value={editForm.estado || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, estado: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      >
                        <option value="planificado">Planificado</option>
                        <option value="en_curso">En Curso</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedApi === 'Promos' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.nombre || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.descripcion || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.descuento || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, descuento: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.activa || false}
                          onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, activa: e.target.checked }))}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Promoción Activa
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {selectedApi === 'Ordenes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Total
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.total || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, total: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Estado
                      </label>
                      <select
                        value={editForm.estado || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, estado: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="en_preparacion">En Preparación</option>
                        <option value="lista">Lista</option>
                        <option value="entregada">Entregada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Forma de Pago
                      </label>
                      <select
                        value={editForm.forma_pago || ''}
                        onChange={(e) => setEditForm((prev: Record<string, any>) => ({ ...prev, forma_pago: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Error Message */}
                {editError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                      </svg>
                      <span className="text-sm text-red-700 dark:text-red-400">{editError}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedItem(null);
                      setEditForm({});
                      setEditError('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isEditing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Eliminar */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                ¿Estás seguro de que deseas eliminar 
                {selectedApi === 'Get Users' && selectedItem.email && ` el usuario "${selectedItem.email}"`}
                {selectedApi === 'Buffets' && selectedItem.nombre && ` el buffet "${selectedItem.nombre}"`}
                {selectedApi === 'Productos' && selectedItem.nombre && ` el producto "${selectedItem.nombre}"`}
                {selectedApi === 'Eventos' && selectedItem.nombre && ` el evento "${selectedItem.nombre}"`}
                {selectedApi === 'Promos' && selectedItem.nombre && ` la promoción "${selectedItem.nombre}"`}
                {selectedApi === 'Ordenes' && ` la orden "${selectedItem._id?.slice(-8).toUpperCase()}"`}
                ?
              </p>

              {/* Error Message */}
              {deleteError && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                    </svg>
                    <span className="text-sm text-red-700 dark:text-red-400">{deleteError}</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                    setDeleteError('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}