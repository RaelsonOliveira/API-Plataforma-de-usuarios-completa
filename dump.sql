
create database dindin;


create table usuarios (
    id serial primary key,
    nome text not null,
    email text not null,
    senha text not null
);

create table categorias (
    id serial primary key,
    descricao text 
);

create table transacoes (
    id serial primary key,
    descricao text,
    valor text,
    data timestamp default now(),
    categoria_id integer not null references categorias(id),
    usuario_id integer not null references usuarios(id),
    tipo text
);

