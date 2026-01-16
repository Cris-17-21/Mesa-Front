// MODELO DE USUARIO
export interface User {
    id: string;
    username: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    tipoDocumento: string;
    numeroDocumento: string;
    sexo: string;
    fechaNacimiento: string;
    telefono: string;
    direccion: string;
    email: string;
    role: string;
};

// CREATE DTO
export type CreateUserDto = Omit<User, 'id' | 'role'> & {
    password: string;
    roleId: string
};

// UPDATE DTO
export type UpdateUserDto = Partial<CreateUserDto>; 