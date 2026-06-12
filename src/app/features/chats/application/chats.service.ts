import { Injectable } from '@angular/core';
import { ChatContact, ChatMessage } from '../domain/chat.models';

@Injectable({
  providedIn: 'root',
})
export class ChatsService {
  getContacts(): ChatContact[] {
    return [
      {
        id: 1,
        name: 'Juan Pérez',
        lastMessage: 'Sí dale! Si querés podemos encontrarnos...',
        time: 'hace 2h',
        unread: 2,
        online: true,
      },
      {
        id: 2,
        name: 'Dona',
        lastMessage: 'Te pareció, pero él no es Carlitos.',
        time: 'hace 3h',
      },
      {
        id: 3,
        name: 'Milton Delgado',
        lastMessage: 'Te paso una foto más con Flan.',
        time: '12:30',
        unread: 1,
      },
      {
        id: 4,
        name: 'Pablo Pérez',
        lastMessage: 'Lo encontré ayer cerca del parque.',
        time: 'ayer',
      },
      {
        id: 5,
        name: 'Sofía R.',
        lastMessage: 'Hola! Vi un gato parecido en Caballito.',
        time: '02/03',
      },
    ];
  }

  getMessages(): ChatMessage[] {
    return [
      {
        id: 1,
        sender: 'other',
        text: 'Hola! Te escribo por el Golden que encontraste hace unos días.',
        time: '12:28',
      },
      {
        id: 2,
        sender: 'other',
        text: 'Se parece bastante al mío que perdí la semana pasada, ¿podrías enviarme más fotos?',
        time: '12:28',
      },
      {
        id: 3,
        sender: 'me',
        text: 'Hola! Sí dale, ya te mando.',
        time: '12:29',
      },
      {
        id: 4,
        sender: 'me',
        imageUrl: 'assets/images/chat-cat.jpg',
        time: '12:29',
      },
      {
        id: 5,
        sender: 'other',
        text: 'Creo que es él!! Para quitarme la duda, ¿podríamos encontrarnos?',
        time: '12:30',
      },
      {
        id: 6,
        sender: 'other',
        text: 'En cualquier Veterinaria o punto en común',
        time: '12:30',
      },
      {
        id: 7,
        sender: 'me',
        text: 'Sí dale! Si querés podemos encontrarnos en Veterinaria Puppi',
        time: '12:31',
      },
    ];
  }
}