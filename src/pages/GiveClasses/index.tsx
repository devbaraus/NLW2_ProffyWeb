import React, { FormEvent, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Input from '../../components/Input'
import Select from '../../components/Select'
import warningIcon from '../../assets/images/icons/warning.svg'
import api from '../../services/api'
import './styles.scss'
import Textarea from '../../components/Textarea'
import { ScheduleInterface, SubjectInterface } from '../../interfaces'

function GiveClasses() {
  const history = useHistory()

  function useQuery() {
    return new URLSearchParams(useLocation().search)
  }

  const [scheduleItems, setScheduleItems] = useState<ScheduleInterface[]>([
    { week_day: '', from: '', to: '' },
  ])

  const [storedSubjects, setStoredSubjects] = useState<SubjectInterface[]>([])

  const [subject, setSubject] = useState('')
  const [summary, setSummary] = useState('')
  const [cost, setCost] = useState('')

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const classID = useQuery().has('edit') ? useQuery().get('edit') : null

  function validForm() {
    if (subject === '') return false
    if (cost === '') return false
    if (summary === '') return false
    for (let index in scheduleItems) {
      let scheduleItem = scheduleItems[index]
      if (scheduleItem.from >= scheduleItem.to) {
        return false
      }
    }
    return true
  }

  async function addNewScheduleItem() {
    if (!!classID) {
      api
        .post('/class-schedule', {
          class_id: classID,
        })
        .then((response) => {
          const scheduleItem = response.data
          return setScheduleItems([...scheduleItems, scheduleItem])
        })
    }

    return setScheduleItems([
      ...scheduleItems,
      { week_day: '', from: '', to: '' },
    ])
  }

  function handleCreateOrUpdateClass(e: FormEvent) {
    e.preventDefault()
    if (!validForm()) {
      return window.alert('Seu formulário de cadastro está incorreto!')
    }
    if (!classID) {
      api
        .post('classes', {
          subject_id: subject,
          cost: Number(cost),
          summary,
          schedule: scheduleItems,
        })
        .then(() => {
          alert('Cadastro feito com sucesso!')
          history.push('/')
        })
        .catch(() => {
          alert('Não foi possível fazer o cadastro!')
        })
    } else {
      api
        .put('classes', {
          id: classID,
          subject_id: subject,
          cost: Number(cost),
          summary,
          schedule: scheduleItems,
        })
        .then(() => {
          alert('Classe atualizada com sucesso!')
        })
        .catch(() => {
          alert('Não foi possível fazer a atualização do cadastro!')
        })
    }
  }

  function setScheduleItemValue(
    position: number,
    field: string,
    value: string,
  ) {
    const updatedScheduleItems = scheduleItems.map((scheduleItem, index) => {
      if (index === position) {
        return {
          ...scheduleItem,
          [field]: value,
        }
      }
      return scheduleItem
    })
    setScheduleItems(updatedScheduleItems)
  }

  function handleDeleteClassSchedule(index: number) {
    if (scheduleItems.length > 1) {
      if (!!classID) {
        let initialSchedule = [...scheduleItems]
        api
          .delete('/class-schedule', {
            params: {
              // @ts-ignore
              id: initialSchedule[index]['id'],
            },
          })
          .then((response) => {
            initialSchedule.splice(index, 1)
            return setScheduleItems(initialSchedule)
          })
      } else {
        let initialSchedule = [...scheduleItems]
        initialSchedule.splice(index, 1)
        return setScheduleItems(initialSchedule)
      }
    }
  }

  useEffect(() => {
    api.get('subjects').then((response) => {
      setStoredSubjects(response.data)
    })

    if (!!classID) {
      api
        .get('classes', {
          params: {
            id: classID,
          },
        })
        .then((response) => {
          const classItem = response.data
          setSubject(classItem.subject_id)
          setSummary(classItem.summary)
          setCost(classItem.cost)
          setScheduleItems(classItem.schedules)
        })
        .catch((err) => {
          history.push('/give-classes')
        })
    }
  }, [])

  function handleDeleteClass() {
    api
      .delete('/classes', {
        params: {
          id: classID,
        },
      })
      .then((response) => {
        window.alert('Aula deletada')
        history.push('/')
      })
  }

  return (
    <div id="page-teacher-form" className="container">
      <PageHeader
        page="Dar aulas"
        title="Que incrível que você quer dar aulas."
        description="O primeiro passo é preencher esse formulário de inscrição"
      />

      <main>
        <form onSubmit={handleCreateOrUpdateClass}>
          <fieldset>
            <legend>
              Sobre a aula{' '}
              {!!classID ? (
                <button
                  type="button"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={handleDeleteClass}
                >
                  - Deletar aula
                </button>
              ) : (
                ''
              )}
            </legend>
            <div id="subject-info">
              <div>
                <Select
                  label="Matéria"
                  name="subject"
                  required
                  options={storedSubjects.map((subject) => {
                    return {
                      value: subject.id,
                      label: subject.name,
                    }
                  })}
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.options[e.target.selectedIndex].value)
                  }
                />
              </div>
              <div>
                <Input
                  label="Custo da sua hora por aula"
                  name="cost"
                  value={cost}
                  required
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>
            <Textarea
              label="Sumário"
              name="summary"
              value={summary}
              required
              onChange={(e) => {
                setSummary(e.target.value)
              }}
            />
          </fieldset>
          <fieldset>
            <legend>
              Horários disponíveis
              <button type="button" onClick={addNewScheduleItem}>
                + Novo horário
              </button>
            </legend>
            {scheduleItems.map((scheduleItem, index) => {
              return (
                <div key={index}>
                  <div className="schedule-item">
                    <Select
                      label="Dia da Semana"
                      name="week_day"
                      options={[
                        {
                          value: 0,
                          label: 'Domingo',
                        },
                        {
                          value: 1,
                          label: 'Segunda-feira',
                        },
                        {
                          value: 2,
                          label: 'Terça-feira',
                        },
                        {
                          value: 3,
                          label: 'Quarta-feira',
                        },
                        {
                          value: 4,
                          label: 'Quinta-feira',
                        },
                        {
                          value: 5,
                          label: 'Sexta-feira',
                        },
                        { value: 6, label: 'Sábado' },
                      ]}
                      value={scheduleItem.week_day}
                      required
                      onChange={(e) =>
                        setScheduleItemValue(index, 'week_day', e.target.value)
                      }
                    />
                    <div className="schedule-time">
                      <Input
                        label="Das"
                        name="from"
                        type="time"
                        value={scheduleItem.from}
                        required
                        onChange={(e) =>
                          setScheduleItemValue(index, 'from', e.target.value)
                        }
                      />
                      <Input
                        label="Até"
                        name="to"
                        type="time"
                        value={scheduleItem.to}
                        required
                        onChange={(e) =>
                          setScheduleItemValue(index, 'to', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="schedule-item-delete">
                    <hr />
                    <span onClick={(e) => handleDeleteClassSchedule(index)}>
                      Excluir horário
                    </span>
                    <hr />
                  </div>
                </div>
              )
            })}
          </fieldset>
          <footer>
            <p>
              <img src={warningIcon} alt="Aviso importante" />
              Importante! <br />
              Preencha todos os dados
            </p>
            <button type="submit">Salvar cadastro</button>
          </footer>
        </form>
      </main>
    </div>
  )
}

export default GiveClasses
