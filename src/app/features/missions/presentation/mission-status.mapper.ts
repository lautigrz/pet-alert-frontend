export const MissionStatusMapper = {
  isOpen: (status?: string): boolean => status === 'OPEN',
  isInProgress: (status?: string): boolean => status === 'IN_PROGRESS',
  isClosed: (status?: string): boolean => status === 'CLOSED',
  
  getLabel: (status?: string): string => {
    switch (status) {
      case 'OPEN': return 'Abierta';
      case 'IN_PROGRESS': return 'En progreso';
      case 'CLOSED': return 'Cerrada';
      default: return status || '';
    }
  }
};

export const UpdateStatusMapper = {
  isApproved: (status?: string): boolean => status === 'APPROVED',
  isRejected: (status?: string): boolean => status === 'REJECTED',
  
  getLabel: (status?: string): string => {
    switch (status) {
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return 'Pendiente de valoración';
    }
  }
};
