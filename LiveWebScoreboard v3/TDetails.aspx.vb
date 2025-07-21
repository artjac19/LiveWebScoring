Imports System.Web
Imports System.Web.UI
Imports System.Security.Cryptography.X509Certificates
Imports System.Text.RegularExpressions

Public Class TDetails
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(sender As Object, e As EventArgs) Handles Me.Load
        Try
            Response.Clear()
            Response.ContentType = "application/json"

            Dim sanctionId As String = Request.QueryString("sid")

            If String.IsNullOrEmpty(sanctionId) OrElse Not Regex.IsMatch(sanctionId, "^[0-9][0-9][CEMSWUX][0-9][0-9][0-9]$") Then
                Dim errorResponse As New With {.Success = False, .ErrorMessage = "Invalid or missing sanction ID"}
                Response.Write(New System.Web.Script.Serialization.JavaScriptSerializer().Serialize(errorResponse))
                Return
            End If

            Dim sArrOfficials = ModDataAccess3.GetOfficials(sanctionId)
            Dim sArrSpecs = ModDataAccess3.GetTournamentSpecs(sanctionId)

            Dim activeEvent As String = ModDataAccess3.GetCurrentEvent(sanctionId, -15)
            If activeEvent Is Nothing Then activeEvent = ""

            Dim jsSerializer As New System.Web.Script.Serialization.JavaScriptSerializer()

            Dim officials As New List(Of Object)()
            If sArrOfficials IsNot Nothing Then
                If Left(sArrOfficials(0, 0), 5) <> "Error" Then
                    For i As Integer = 0 To UBound(sArrOfficials, 1)
                        Dim roleObj = sArrOfficials(i, 1)
                        Dim nameObj = sArrOfficials(i, 2)

                        Try
                            If roleObj IsNot Nothing AndAlso nameObj IsNot Nothing Then
                                Dim role As String = roleObj.ToString()
                                Dim name As String = nameObj.ToString()
                                Dim lastName As String = ""
                                Dim firstName As String = ""
                                Dim commaIdx As Integer = name.IndexOf(",")
                                If commaIdx > -1 Then
                                    lastName = name.Substring(0, commaIdx).Trim()
                                    firstName = name.Substring(commaIdx + 1).Trim()
                                Else
                                    lastName = name
                                End If

                                officials.Add(New With {role, firstName, lastName})
                            End If
                        Catch exOfficial As Exception
                            officials.Add(New With {.Role = "ERROR", .FirstName = "", .LastName = ""})
                        End Try
                    Next
                End If
            End If

            Dim tDetails As New List(Of Object)()
            If sArrSpecs IsNot Nothing AndAlso sArrSpecs.Rank = 2 AndAlso sArrSpecs.GetLength(1) >= 3 Then
                For i As Integer = 1 To sArrSpecs.GetLength(0) - 1
                    Dim label As Object = sArrSpecs(i, 1)
                    Dim value As Object = sArrSpecs(i, 2)

                    If (label IsNot Nothing AndAlso Not String.IsNullOrEmpty(label.ToString())) OrElse (value IsNot Nothing AndAlso Not String.IsNullOrEmpty(value.ToString())) Then
                        Dim labelStr As String = If(label Is Nothing OrElse label Is DBNull.Value, Nothing, label.ToString())
                        Dim valueStr As String = If(value Is Nothing OrElse value Is DBNull.Value, Nothing, value.ToString())
                        tDetails.Add({labelStr, valueStr})
                    End If
                Next
            End If

            Dim teams As New List(Of Object)()
            Dim teamsData As String = ModDataAccess3.GetTeams(sanctionId)

            If teamsData IsNot Nothing AndAlso Not teamsData.StartsWith("Error") AndAlso teamsData.Trim() <> "" Then
                Dim teamLines As String() = teamsData.Split(New String() {Environment.NewLine, "\r\n", "\n", "\r"}, StringSplitOptions.RemoveEmptyEntries)

                For Each team As String In teamLines
                    If team IsNot Nothing AndAlso team.Trim() <> "" Then
                        teams.Add(New With {.Name = team.Trim()})
                    End If
                Next
            End If

            Dim responseObj As New With {
                .Success = True,
                activeEvent,
                officials,
                tDetails,
                teams
            }

            Response.Write(jsSerializer.Serialize(responseObj))

        Catch ex As Exception
            System.Diagnostics.Debug.WriteLine("TDetails.aspx.vb error: " & ex.ToString())
        End Try
        Try
            Response.End()
        Catch exThreadAbort As Threading.ThreadAbortException
            ' Suppress ThreadAbortException thrown by Response.End()
        End Try
    End Sub
End Class